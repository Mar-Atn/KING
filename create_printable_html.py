import os
import subprocess
import base64
from datetime import datetime

def read_file_content(filepath):
    """Read content from a file"""
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        print(f"Warning: {filepath} not found")
        return f"<em>Content not found: {filepath}</em>"

def get_logo_base64(logo_path):
    """Convert logo to base64 for embedding"""
    try:
        with open(logo_path, 'rb') as f:
            logo_data = f.read()
            return base64.b64encode(logo_data).decode('utf-8')
    except Exception as e:
        print(f"Warning: Could not load logo {logo_path}: {e}")
        return None

def md_to_html(md_content):
    """Convert markdown to HTML using a more robust line-by-line approach."""
    lines = md_content.split('\n')
    html_lines = []
    for line in lines:
        # Remove bold and italic formatting first
        line = line.replace('**', '').replace('*', '')

        # Handle headers
        if line.startswith('# '):
            html_lines.append(f'<h1>{line[2:].strip()}</h1>')
        elif line.startswith('## '):
            html_lines.append(f'<h2>{line[3:].strip()}</h2>')
        elif line.startswith('### '):
            html_lines.append(f'<h3>{line[4:].strip()}</h3>')
        # Handle separators, which seem to be just '#' on a line
        elif line.strip() == '#':
            html_lines.append('<hr class="content-divider">')
        # Handle non-empty lines as paragraphs
        elif line.strip():
            html_lines.append(f'<p>{line.strip()}</p>')
        # Empty lines are ignored, creating natural paragraph breaks
    
    return ''.join(html_lines)

def simple_md_to_html(md_content):
    """DEPRECATED: This function is no longer used, but kept for reference.
    The new md_to_html function provides more reliable parsing."""
    return md_to_html(md_content) # Redirect to the new function

def get_character_names():
    """Get all character names from the roles folder"""
    characters = []
    clan_mapping = {
        'military': 'Military',
        'merchants': 'Merchants', 
        'landlords': 'Landlords',
        'bankers': 'Bankers',
        'artificers': 'Artificers',
        'philosophers': 'Philosophers'
    }
    
    roles_dir = 'roles'
    if not os.path.exists(roles_dir):
        print(f"Error: {roles_dir} directory not found")
        return []
    
    for filename in os.listdir(roles_dir):
        if filename.endswith('.md'):
            # Extract clan from filename (e.g., "military-clan-1-strategos-nikias.md")
            clan_key = filename.split('-')[0]
            clan_name = clan_mapping.get(clan_key, clan_key.capitalize())
            
            # Read file to get character name
            content = read_file_content(os.path.join(roles_dir, filename))
            if content:
                
                # Extract character name from first line (# Character Name)
                lines = content.split('\n')
                if lines and lines[0].startswith('# '):
                    character_name = lines[0][2:].strip()
                    characters.append((character_name, clan_name, filename))
    
    return characters

def create_package_html(character_name, clan_name, role_filename):
    """Create HTML content for one character package"""
    
    # Get logos as base64
    cyprus_logo = get_logo_base64('logo/logo cyprus.png')
    sigh_logo = get_logo_base64('logo/sigh-white.png')
    
    # Create logo HTML
    logo_html = ""
    if cyprus_logo and sigh_logo:
        logo_html = f'''
        <div class="logo-container">
            <img src="data:image/png;base64,{cyprus_logo}" alt="Cyprus Logo" class="logo-left">
            <img src="data:image/png;base64,{sigh_logo}" alt="Sigh Logo" class="logo-right">
        </div>
        '''
    
    # Read the four required files
    player_guide_1 = read_file_content('general context/Player Guide 1 _ General Context.md')
    player_guide_2 = read_file_content('general context/Player Guide 2 _ Election Process.md')
    
    # Get clan file
    clan_file = f'clans/Clan of {clan_name}.md' if clan_name != 'Military' else 'clans/Clan of Military.md'
    clan_content = read_file_content(clan_file)
    
    # Get role file
    role_content = read_file_content(f'roles/{role_filename}')
    
    # Create the 4-page HTML structure
    package_html = f'''
    <div class="package" id="package-{character_name.replace(' ', '-').lower()}">
        <!-- PAGE 1: Header + General Context -->
        <div class="page page-1">
            <div class="page-header">
                {logo_html}
                <h1>{character_name}</h1>
                <h2 class="clan-name">{clan_name} Clan</h2>
                <hr class="header-divider">
            </div>
            <div class="page-content">
                {md_to_html(player_guide_1)}
            </div>
        </div>
        
        <!-- PAGE 2: Clan Description -->
        <div class="page page-2">
            <div class="page-header">
                <h2>Clan Description</h2>
                <hr class="header-divider">
            </div>
            <div class="page-content">
                {md_to_html(clan_content)}
            </div>
        </div>
        
        <!-- PAGE 3: Individual Role -->
        <div class="page page-3">
            <div class="page-header">
                <h2>Individual Role</h2>
                <hr class="header-divider">
            </div>
            <div class="page-content">
                {md_to_html(role_content)}
            </div>
        </div>
        
        <!-- PAGE 4: Election Process -->
        <div class="page page-4">
            <div class="page-header">
                <h2>Election Process</h2>
                <hr class="header-divider">
            </div>
            <div class="page-content">
                {md_to_html(player_guide_2)}
            </div>
        </div>
    </div>
    '''
    
    return package_html

def create_css_styles():
    """Create CSS for professional A4 printing with COMPLETELY CONSISTENT slim formatting"""
    return '''
    <style>
        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.2;
            color: #333;
            background: white;
        }
        
        /* Page setup for A4 */
        .page {
            width: 210mm;
            height: 297mm;
            padding: 15mm;
            margin: 0 auto;
            background: white;
            page-break-after: always;
            position: relative;
        }
        
        .page:last-child {
            page-break-after: avoid;
        }
        
        /* Header styling */
        .page-header {
            margin-bottom: 8mm;
            padding-top: 15mm; /* Changed from 25mm to 15mm to move title higher */
        }
        
        .page-2 .page-header,
        .page-3 .page-header,
        .page-4 .page-header {
            padding-top: 0; /* No logos on other pages */
        }

        /* Logo styling */
        .logo-container {
            position: absolute;
            top: 10mm; /* Keep logos at same position */
            left: 0;
            right: 0;
            height: 20mm;
            z-index: 10;
        }
        
        .logo-left {
            position: absolute;
            left: 15mm;
            top: 0;
            height: 18mm;
            width: auto;
        }
        
        .logo-right {
            position: absolute;
            right: 15mm;
            top: 0;
            height: 18mm;
            width: auto;
        }
        
        /* Header styling */
        .page-header {
            margin-bottom: 8mm;
            padding-top: 15mm; /* Changed from 25mm to 15mm to move title higher */
        }
        
        .page-2 .page-header,
        .page-3 .page-header,
        .page-4 .page-header {
            padding-top: 0; /* No logos on other pages */
        }
        
        .page-header h1 {
            font-size: 18pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 3mm;
            color: #2c5530;
        }
        
        .page-header h2 {
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 5mm;
            color: #2c5530;
        }
        
        .clan-name {
            font-size: 12pt !important;
            color: #666;
        }
        
        .header-divider {
            border: none;
            border-top: 1px solid #ccc;
            margin: 5mm 0;
        }
        
        /* Content styling - CONSISTENT PLAIN TEXT */
        .page-content {
            font-size: 11pt;
            line-height: 1.2;
            text-align: justify;
        }
        
        .page-content p {
            margin-bottom: 3mm;
            font-size: 10pt;
            font-weight: normal;
            line-height: 1.2;
        }
        
        /* Content headers - 3 standard types */
        .page-content h1 {
            font-size: 12pt;
            font-weight: bold;
            margin: 5mm 0 3mm 0;
            color: #2c5530;
        }
        
        .page-content h2 {
            font-size: 11pt;
            font-weight: bold;
            margin: 4mm 0 2mm 0;
            color: #2c5530;
        }
        
        .page-content h3 {
            font-size: 10pt;
            font-weight: bold;
            margin: 3mm 0 2mm 0;
            color: #2c5530;
        }
        
        .content-divider {
            border: none;
            border-top: 1px solid #e0e0e0;
            margin: 4mm 0;
        }

        /* Ensure no unwanted bold text appears */
        .page-content strong, .page-content b {
            font-weight: normal !important;
        }

        /* Lists styling - slim and consistent */
        .page-content ul, .page-content ol {
            margin: 2mm 0 2mm 5mm;
            padding-left: 0;
        }
        
        .page-content li {
            margin-bottom: 1mm;
            font-size: 10pt;
            line-height: 1.2;
        }
        
        /* Print styles */
        @media print {
            body {
                margin: 0;
                padding: 0;
                font-size: 11pt;
            }
            
            .page {
                margin: 0;
                padding: 15mm;
                page-break-after: always;
                box-shadow: none;
                border: none;
            }
            
            .page:last-child {
                page-break-after: avoid;
            }
            
            /* Prevent page breaks in wrong places */
            .page-header {
                page-break-after: avoid;
            }
            
            .page-content h1,
            .page-content h2,
            .page-content h3 {
                page-break-after: avoid;
                orphans: 2;
                widows: 2;
            }
        }
        
        /* Screen preview styles */
        @media screen {
            body {
                background: #f5f5f5;
                padding: 10px;
            }
            
            .package {
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                margin-bottom: 20px;
            }
            
            .page {
                border: 1px solid #ddd;
                margin-bottom: 10px;
            }
        }
    </style>
    '''

def main():
    """Generate HTML packages for all characters"""
    print("Creating HTML packages for The New King of Kourion simulation...")
    
    # Get all characters
    characters = get_character_names()
    
    if not characters:
        print("Error: No characters found in roles folder")
        return
    
    print(f"Found {len(characters)} characters")
    
    # Create HTML content
    html_content = [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '<meta charset="UTF-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '<title>The New King of Kourion - Participant Packages</title>',
        create_css_styles(),
        '</head>',
        '<body>',
        f'<div class="generation-info" style="text-align: center; margin: 20px; font-size: 10pt; color: #666;">',
        f'Generated on {datetime.now().strftime("%B %d, %Y at %I:%M %p")}',
        f'</div>'
    ]
    
    # Add each character package
    for character_name, clan_name, role_filename in characters:
        print(f"Processing {character_name} ({clan_name})...")
        package_html = create_package_html(character_name, clan_name, role_filename)
        html_content.append(package_html)
    
    # Close HTML
    html_content.extend(['</body>', '</html>'])
    
    # Write to file
    output_file = 'all_participant_packages.html'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(html_content))
    
    print(f"\n✅ Successfully created {output_file}")
    print(f"📄 Contains {len(characters)} character packages")
    print(f"🖨️  Ready for A4 printing - open in browser and print")
    print(f"💡 Tip: Use 'Print' → 'More settings' → 'Paper size: A4' → 'Margins: Minimum'")

if __name__ == "__main__":
    main()