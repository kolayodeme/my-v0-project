#!/usr/bin/env python
import os
import re
import json
from pathlib import Path

# Turkish characters and common Turkish words to help identify Turkish strings
TURKISH_CHARS = set('ğĞüÜşŞıİöÖçÇ')
COMMON_TURKISH_WORDS = [
    've', 'veya', 'için', 'ile', 'bu', 'şu', 'daha', 'en', 'bir', 'olarak',
    'canlı', 'maç', 'lig', 'tahmin', 'analiz', 'yükleniyor', 'hata', 'veri',
    'dil', 'galibiyet', 'beraberlik', 'mağlubiyet', 'evet', 'hayır', 'üst', 'alt',
    'tarih', 'saat', 'göster', 'seç', 'filtrele', 'ara'
]

# List of directories to scan
DIRS_TO_SCAN = ['app', 'components', 'lib', 'pages', 'hooks']

# List of file extensions to scan
EXTENSIONS_TO_SCAN = ['.tsx', '.ts', '.jsx', '.js']

# Files that contain translation mappings
TRANSLATION_FILES = ['lib/translations.ts', 'components/language-provider.tsx']

# Output file
OUTPUT_FILE = 'turkish_strings.json'

def is_likely_turkish(text):
    """Check if a string is likely to be Turkish based on characters or common words"""
    # Check if it contains any Turkish-specific characters
    if any(c in TURKISH_CHARS for c in text):
        return True
    
    # Check if it contains common Turkish words
    words = re.findall(r'\b\w+\b', text.lower())
    if any(word in COMMON_TURKISH_WORDS for word in words):
        return True
    
    return False

def extract_string_literals(content):
    """Extract string literals from file content"""
    # Match single and double quoted strings
    single_quotes = re.findall(r"'([^'\\]*(\\.[^'\\]*)*)'", content)
    double_quotes = re.findall(r'"([^"\\]*(\\.[^"\\]*)*)"', content)
    
    # Extract the first group from each match
    singles = [s[0] for s in single_quotes]
    doubles = [s[0] for s in double_quotes]
    
    return singles + doubles

def extract_translations(content):
    """Extract translations from translation files"""
    tr_dict = {}
    en_dict = {}
    
    # Extract 'tr' object in translations.ts
    tr_match = re.search(r'const\s+tr\s*=\s*{([^}]*)}', content, re.DOTALL)
    if tr_match:
        tr_block = tr_match.group(1)
        tr_items = re.findall(r'(\w+):\s*[\'"]([^\'"]*)[\'"]', tr_block)
        for key, value in tr_items:
            tr_dict[key] = value
    
    # Extract 'en' object in translations.ts
    en_match = re.search(r'const\s+en\s*=\s*{([^}]*)}', content, re.DOTALL)
    if en_match:
        en_block = en_match.group(1)
        en_items = re.findall(r'(\w+):\s*[\'"]([^\'"]*)[\'"]', en_block)
        for key, value in en_items:
            en_dict[key] = value
    
    # Extract 'tr' object in language-provider.tsx
    tr_match = re.search(r'tr:\s*{([^}]*)}', content, re.DOTALL)
    if tr_match:
        tr_block = tr_match.group(1)
        tr_items = re.findall(r'(\w+):\s*[\'"]([^\'"]*)[\'"]', tr_block)
        for key, value in tr_items:
            tr_dict[key] = value
    
    # Extract 'en' object in language-provider.tsx
    en_match = re.search(r'en:\s*{([^}]*)}', content, re.DOTALL)
    if en_match:
        en_block = en_match.group(1)
        en_items = re.findall(r'(\w+):\s*[\'"]([^\'"]*)[\'"]', en_block)
        for key, value in en_items:
            en_dict[key] = value
    
    return tr_dict, en_dict

def scan_file(file_path):
    """Scan a single file for Turkish strings"""
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Get string literals
    strings = extract_string_literals(content)
    
    # Filter for Turkish strings
    turkish_strings = [s for s in strings if is_likely_turkish(s) and len(s) > 1]
    
    if turkish_strings:
        return {
            'file': str(file_path),
            'strings': turkish_strings
        }
    return None

def main():
    # Store all found Turkish strings
    all_findings = []
    
    # Build translations dictionary
    translations_tr = {}
    translations_en = {}
    
    print(f"Scanning translation files...")
    for translation_file in TRANSLATION_FILES:
        if os.path.exists(translation_file):
            with open(translation_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            tr_dict, en_dict = extract_translations(content)
            translations_tr.update(tr_dict)
            translations_en.update(en_dict)
    
    print(f"Found {len(translations_tr)} Turkish translations with English equivalents")
    
    # Scan directories
    for directory in DIRS_TO_SCAN:
        dir_path = Path(directory)
        if not dir_path.exists():
            print(f"Directory {directory} does not exist, skipping...")
            continue
        
        print(f"Scanning directory: {directory}")
        for file_path in dir_path.glob('**/*'):
            if file_path.is_file() and file_path.suffix in EXTENSIONS_TO_SCAN:
                try:
                    result = scan_file(file_path)
                    if result:
                        all_findings.append(result)
                        print(f"Found {len(result['strings'])} Turkish strings in {file_path}")
                except Exception as e:
                    print(f"Error scanning {file_path}: {e}")
    
    # Create translations mapping
    translations_map = {}
    
    # Add existing translations from translation files
    for tr_key, tr_value in translations_tr.items():
        if tr_key in translations_en:
            translations_map[tr_value] = translations_en[tr_key]
    
    # Add other found Turkish strings without translations
    for finding in all_findings:
        for string in finding['strings']:
            if string not in translations_map:
                translations_map[string] = ""  # Empty string for manual translation
    
    # Save results
    result = {
        'files_with_turkish': all_findings,
        'translations': translations_map
    }
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"\nScan complete!")
    print(f"Found Turkish strings in {len(all_findings)} files")
    print(f"Total unique Turkish strings: {len(translations_map)}")
    print(f"Results saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
