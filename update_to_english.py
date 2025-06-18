#!/usr/bin/env python
import os
import json
import re
from pathlib import Path

# Configuration
DIRS_TO_UPDATE = ['app', 'components', 'lib', 'pages', 'hooks']
EXTENSIONS_TO_UPDATE = ['.tsx', '.ts', '.jsx', '.js']
TURKISH_STRINGS_FILE = 'turkish_strings.json'

# Load translations
with open(TURKISH_STRINGS_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)
    translations = data['translations']
    files_with_turkish = data['files_with_turkish']

def update_file(file_path, translations_map):
    """Update Turkish strings in a file with their English translations"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        original_content = content
        
        # Get a sorted list of Turkish strings (longer strings first to avoid substring issues)
        turkish_strings = sorted(translations_map.keys(), key=len, reverse=True)
        
        # Replace each Turkish string with its English translation
        for turkish in turkish_strings:
            if turkish and len(turkish) > 1:  # Skip empty strings or single characters
                english = translations_map.get(turkish, "")
                if english:  # Only replace if we have a translation
                    # Escape special regex characters in the Turkish string
                    escaped_turkish = re.escape(turkish)
                    # Replace the Turkish string with its English translation
                    content = re.sub(
                        f'"{escaped_turkish}"', 
                        f'"{english}"', 
                        content
                    )
                    content = re.sub(
                        f"'{escaped_turkish}'", 
                        f"'{english}'", 
                        content
                    )
        
        # Only write if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error updating {file_path}: {e}")
        return False

def update_default_language(file_path, new_default="en"):
    """Update the default language in language provider files"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Replace default language in translations.ts
        if 'translations.ts' in file_path:
            content = re.sub(
                r"let currentLanguage: SupportedLanguage = '([^']*)'", 
                f"let currentLanguage: SupportedLanguage = '{new_default}'", 
                content
            )
        
        # Replace default language in language-provider.tsx
        if 'language-provider.tsx' in file_path:
            content = re.sub(
                r'const \[language, setLanguage\] = useState<Language>\("([^"]*)"\)', 
                f'const [language, setLanguage] = useState<Language>("{new_default}")', 
                content
            )
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"Error updating default language in {file_path}: {e}")
        return False

def main():
    """Main function to update Turkish strings to English"""
    updated_files = []
    language_files_updated = []
    
    # First, update the default language in translation files
    for file_path in ['lib/translations.ts', 'components/language-provider.tsx']:
        if os.path.exists(file_path):
            if update_default_language(file_path):
                language_files_updated.append(file_path)
    
    # Then update Turkish strings in all files
    for directory in DIRS_TO_UPDATE:
        dir_path = Path(directory)
        if not dir_path.exists():
            print(f"Directory {directory} does not exist, skipping...")
            continue
        
        print(f"Scanning directory: {directory}")
        for file_path in dir_path.glob('**/*'):
            if file_path.is_file() and file_path.suffix in EXTENSIONS_TO_UPDATE:
                try:
                    if update_file(file_path, translations):
                        updated_files.append(str(file_path))
                        print(f"Updated {file_path}")
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
    
    # Print summary
    print("\nUpdate complete!")
    print(f"Changed default language in {len(language_files_updated)} files")
    print(f"Updated Turkish strings in {len(updated_files)} files")
    
    # Write summary to a file
    with open('update_summary.json', 'w', encoding='utf-8') as f:
        json.dump({
            "language_files_updated": language_files_updated,
            "files_updated": updated_files
        }, f, ensure_ascii=False, indent=2)
    
    print("Summary saved to update_summary.json")

if __name__ == "__main__":
    main() 