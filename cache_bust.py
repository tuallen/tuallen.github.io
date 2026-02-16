#!/usr/bin/env python3
"""
Cache Busting Script for tuallen.github.io

Automatically updates version query strings on static assets to force browser cache refresh.
Supports CSS, JS, PDF, BibTeX, and other static files.

Usage:
    python cache_bust.py              # Dry run (show what would change)
    python cache_bust.py --apply      # Apply changes to files
"""

import re
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple
import argparse


class CacheBuster:
    def __init__(self, root_dir: str = "."):
        self.root_dir = Path(root_dir)
        self.today = datetime.now().strftime("%Y-%m-%d")
        
        # File patterns to search in (HTML files)
        self.html_patterns = ["**/*.html"]
        
        # Asset patterns to cache bust
        self.asset_patterns = [
            r'(href|src)="([^"]+\.css)(?:\?v=[^"]*)?(")',      # CSS files
            r'(href|src)="([^"]+\.js)(?:\?v=[^"]*)?(")',       # JS files
            r'(href|src)="([^"]+\.pdf)(?:\?v=[^"]*)?(")',      # PDF files
            r'(href|src)="([^"]+\.bib)(?:\?v=[^"]*)?(")',      # BibTeX files
            r'(href|src)="([^"]+\.ico)(?:\?v=[^"]*)?(")',      # ICO files
            r'(href|src)="([^"]+\.png)(?:\?v=[^"]*)?(")',      # PNG files
            r'(href|src)="([^"]+\.svg)(?:\?v=[^"]*)?(")',      # SVG files
        ]
        
        self.changes: Dict[str, List[Tuple[str, str]]] = {}
        
    def find_html_files(self) -> List[Path]:
        """Find all HTML files in the project."""
        html_files = []
        for pattern in self.html_patterns:
            html_files.extend(self.root_dir.glob(pattern))
        
        # Exclude hidden directories and system files
        html_files = [
            f for f in html_files 
            if not any(part.startswith('.') for part in f.parts)
        ]
        
        return sorted(html_files)
    
    def extract_current_version(self, content: str) -> str:
        """Extract the most common version string from content."""
        version_pattern = r'\?v=(\d{4}-\d{2}-\d{2}(?:-\d+)?)'
        versions = re.findall(version_pattern, content)
        
        if not versions:
            return None
        
        # Return most common version
        from collections import Counter
        return Counter(versions).most_common(1)[0][0]
    
    def calculate_new_version(self, current_version: str) -> str:
        """Calculate the new version string."""
        if not current_version:
            return self.today
        
        # If current version is from today, increment the suffix
        if current_version.startswith(self.today):
            if '-' in current_version:
                # Extract and increment suffix (e.g., "2026-02-15-2" -> "2026-02-15-3")
                base, suffix = current_version.rsplit('-', 1)
                try:
                    new_suffix = int(suffix) + 1
                    return f"{self.today}-{new_suffix}"
                except ValueError:
                    return f"{self.today}-1"
            else:
                # First update today (e.g., "2026-02-15" -> "2026-02-15-1")
                return f"{self.today}-1"
        else:
            # Different day, use today's date
            return self.today
    
    def process_file(self, file_path: Path, new_version: str) -> str:
        """Process a single HTML file and return updated content."""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        file_changes = []
        
        for pattern in self.asset_patterns:
            def replacer(match):
                attr = match.group(1)  # 'href' or 'src'
                asset_path = match.group(2)  # The file path
                closing_quote = match.group(3)  # The closing "
                
                # Skip external URLs (http://, https://, //)
                if asset_path.startswith(('http://', 'https://', '//')):
                    return match.group(0)
                
                # Skip data URIs
                if asset_path.startswith('data:'):
                    return match.group(0)
                
                # Build new tag
                new_tag = f'{attr}="{asset_path}?v={new_version}{closing_quote}'
                old_tag = match.group(0)
                
                if old_tag != new_tag:
                    file_changes.append((old_tag, new_tag))
                
                return new_tag
            
            content = re.sub(pattern, replacer, content)
        
        if file_changes:
            self.changes[str(file_path)] = file_changes
        
        return content if content != original_content else None
    
    def run(self, dry_run: bool = True) -> None:
        """Run the cache busting process."""
        html_files = self.find_html_files()
        
        if not html_files:
            print("❌ No HTML files found!")
            return
        
        print(f"🔍 Found {len(html_files)} HTML files")
        print(f"📅 Today's date: {self.today}\n")
        
        # Analyze all files to determine current version
        all_content = ""
        for file_path in html_files:
            with open(file_path, 'r', encoding='utf-8') as f:
                all_content += f.read()
        
        current_version = self.extract_current_version(all_content)
        new_version = self.calculate_new_version(current_version)
        
        print(f"📌 Current version: {current_version or 'None'}")
        print(f"🆕 New version: {new_version}\n")
        
        # Process each file
        updates = {}
        for file_path in html_files:
            updated_content = self.process_file(file_path, new_version)
            if updated_content:
                updates[file_path] = updated_content
        
        # Display results
        if not self.changes:
            print("✅ All files are already up to date!")
            return
        
        print(f"📝 Files to update: {len(self.changes)}\n")
        
        for file_path, changes in self.changes.items():
            rel_path = Path(file_path).relative_to(self.root_dir)
            print(f"📄 {rel_path}")
            print(f"   {len(changes)} change(s)")
            
            # Show first few changes as examples
            for old, new in changes[:3]:
                print(f"   - {old}")
                print(f"   + {new}")
            
            if len(changes) > 3:
                print(f"   ... and {len(changes) - 3} more")
            print()
        
        # Apply changes if not dry run
        if not dry_run:
            for file_path, updated_content in updates.items():
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(updated_content)
            
            print(f"✅ Successfully updated {len(updates)} files!")
            print(f"🎉 All assets now use version: {new_version}")
        else:
            print("🔍 DRY RUN - No files were modified")
            print("💡 Run with --apply to apply these changes")


def main():
    parser = argparse.ArgumentParser(
        description="Cache bust static assets in HTML files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python cache_bust.py              # Preview changes (dry run)
  python cache_bust.py --apply      # Apply changes to files
        """
    )
    
    parser.add_argument(
        '--apply',
        action='store_true',
        help='Apply changes to files (default is dry run)'
    )
    
    parser.add_argument(
        '--dir',
        type=str,
        default='.',
        help='Root directory to search (default: current directory)'
    )
    
    args = parser.parse_args()
    
    buster = CacheBuster(root_dir=args.dir)
    buster.run(dry_run=not args.apply)


if __name__ == "__main__":
    main()
