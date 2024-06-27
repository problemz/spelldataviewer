document.getElementById('urlInput').addEventListener('change', fetchSpellData);
document.querySelector('button').addEventListener('click', fetchSpellData);
document.getElementById('searchInput').addEventListener('input', filterSpells);
let spells = [];
let hidePassives = false;
let hideHidden = false;

const spellFamilyMapping = {
    15: 'Death Knight',
    107: 'Demon Hunter',
    7: 'Druid',
    224: 'Evoker',
    9: 'Hunter',
    3: 'Mage',
    53: 'Monk',
    10: 'Paladin',
    6: 'Priest',
    8: 'Rogue',
    11: 'Shaman',
    5: 'Warlock',
    4: 'Warrior',
};

const mainClasses = [
    'Mage', 'Warrior', 'Warlock', 'Priest', 'Druid', 'Rogue',
    'Hunter', 'Paladin', 'Shaman', 'Death Knight', 'Monk',
    'Demon Hunter', 'Evoker'
];

const classColors = {
    'Death Knight': '#C41F3B',
    'Demon Hunter': '#A330C9',
    'Druid': '#FF7D0A',
    'Evoker': '#33937F',
    'Hunter': '#ABD473',
    'Mage': '#69CCF0',
    'Monk': '#00FF96',
    'Paladin': '#F58CBA',
    'Priest': '#FFFFFF',
    'Rogue': '#FFF569',
    'Shaman': '#0070DE',
    'Warlock': '#9482C9',
    'Warrior': '#C79C6E',
};

const classIcons = {
    'Death Knight': 'ClassIcon_DeathKnight.png',
    'Demon Hunter': 'ClassIcon_DemonHunter.png',
    'Druid': 'ClassIcon_Druid.png',
    'Evoker': 'ClassIcon_Evoker.png',
    'Hunter': 'ClassIcon_Hunter.png',
    'Mage': 'ClassIcon_Mage.png',
    'Monk': 'ClassIcon_Monk.png',
    'Paladin': 'ClassIcon_Paladin.png',
    'Priest': 'ClassIcon_Priest.png',
    'Rogue': 'ClassIcon_Rogue.png',
    'Shaman': 'ClassIcon_Shaman.png',
    'Warlock': 'ClassIcon_Warlock.png',
    'Warrior': 'ClassIcon_Warrior.png',
};

function fetchSpellData() {
    const input = document.getElementById('urlInput').value.trim();
    if (!input) {
        console.error('URL input is empty.');
        return;
    }

    if (input.startsWith('http://') || input.startsWith('https://')) {
        fetch(input)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok.');
                }
                return response.text();
            })
            .then(data => {
                parseSpellData(data);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    } else {
        console.error('Invalid URL format.');
    }
}

function parseSpellData(data) {
    spells = [];
    const lines = data.split(/\r?\n/);
    let currentSpell = null;

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("Name")) {
            if (currentSpell) {
                spells.push(currentSpell);
            }
            currentSpell = {};
        }

        if (currentSpell) {
            const [key, ...valueParts] = trimmedLine.split(':');
            if (key && valueParts.length > 0) {
                const value = valueParts.join(':').trim();
                currentSpell[key.trim()] = value;
                if (key.trim() === 'Name') {
                    const idMatch = value.match(/\(id=(\d+)\)/);
                    if (idMatch) {
                        currentSpell['id'] = idMatch[1];
                    }
                }
            }
        }
    });

    if (currentSpell) {
        spells.push(currentSpell);
    }

    // Remove spells without a valid spell family ID
    spells = spells.filter(spell => {
        const spellFamilyMatch = spell['Name'].match(/\[Spell Family \((\d+)\)\]/);
        if (spellFamilyMatch) {
            spell['Spell Family ID'] = spellFamilyMatch[1];
            return true;
        }
        return false;
    });

    populateClassFilter();
    populateSpellSelect();
}

function populateClassFilter() {
    const classFilters = document.getElementById('classCheckboxes');
    classFilters.innerHTML = ''; // Clear previous contents

    mainClasses.forEach(mainClass => {
        const classGroupDiv = document.createElement('div');
        classGroupDiv.className = 'class-group';

        const mainClassCheckbox = document.createElement('input');
        mainClassCheckbox.type = 'checkbox';
        mainClassCheckbox.id = mainClass;
        mainClassCheckbox.addEventListener('change', filterSpellsByClass);
        classGroupDiv.appendChild(mainClassCheckbox);

        const mainClassLabel = document.createElement('label');
        mainClassLabel.htmlFor = mainClass;

        const iconImg = document.createElement('img');
        iconImg.src = `icons/${classIcons[mainClass]}`;
        iconImg.alt = `${mainClass} Icon`;
        iconImg.className = 'class-icon';
        mainClassLabel.appendChild(iconImg);

        const labelText = document.createTextNode(` ${mainClass}`);
        mainClassLabel.appendChild(labelText);
        mainClassLabel.style.color = classColors[mainClass];
        mainClassLabel.style.fontWeight = 'bold';
        mainClassLabel.style.textShadow = '1px 1px 2px black';

        classGroupDiv.appendChild(mainClassLabel);
        classFilters.appendChild(classGroupDiv);
    });
}

function populateSpellSelect() {
    const spellSelect = document.getElementById('spellSelect');
    spellSelect.innerHTML = '<option value="">Select a spell</option>';
}

function displaySpellDetails() {
    const spellId = document.getElementById('spellSelect').value;
    const spell = spells.find(spell => spell['id'] === spellId);
    const spellDetails = document.getElementById('spellDetails');

    if (spell) {
        spellDetails.value = Object.entries(spell).map(([key, value]) => `${key}: ${value}`).join('\n');
        const spellName = sanitizeSpellName(spell['Name']);
        document.getElementById('copySpellText').value = `${spellName} = ${spellId},`;
        document.getElementById('copySpellNameText').value = spellName;
        document.getElementById('copySpellIdText').value = spellId;
    } else {
        spellDetails.value = '';
        document.getElementById('copySpellText').value = '';
        document.getElementById('copySpellNameText').value = '';
        document.getElementById('copySpellIdText').value = '';
    }
}


function sanitizeSpellName(name) {
    // Find the position of the first bracket and trim the name up to that point
    const bracketIndex = name.indexOf('(');
    if (bracketIndex !== -1) {
        name = name.substring(0, bracketIndex).trim();
    }

    // Remove any remaining unwanted characters and capitalize words
    return name
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
        .split(' ') // Split by space
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
        .join(''); // Join all words without spaces
}


function filterSpells() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const spellSelect = document.getElementById('spellSelect');
    spellSelect.innerHTML = '<option value="">Select a spell</option>';

    spells.filter(spell => {
        const spellName = (spell['Name'] || '').toLowerCase();
        const spellId = (spell['id'] || '').toLowerCase();
        return spellName.includes(searchInput) || spellId.includes(searchInput);
    }).forEach(spell => {
        const option = document.createElement('option');
        const spellName = spell['Name'] || 'Unnamed Spell';
        const spellId = spell['id'] || 'No ID';
        option.value = spellId;
        option.textContent = `${spellName} (ID: ${spellId})`;
        spellSelect.appendChild(option);
    });

    spellSelect.addEventListener('change', displaySpellDetails);
}

function filterSpellsByClass() {
    const selectedClasses = [];
    document.querySelectorAll('#classFilter input[type="checkbox"]:checked').forEach(checkbox => {
        selectedClasses.push(checkbox.id);
    });

    const spellSelect = document.getElementById('spellSelect');
    spellSelect.innerHTML = '<option value="">Select a spell</option>';

    if (selectedClasses.length === 0) {
        return;
    }

    spells.filter(spell => {
        const isPassive = spell['Name'] && spell['Name'].toLowerCase().includes('passive');
        const isHidden = spell['Name'] && spell['Name'].toLowerCase().includes('hidden');
        const spellFamilyId = spell['Spell Family ID'];
        return (!hidePassives || !isPassive) && (!hideHidden || !isHidden) && selectedClasses.includes(spellFamilyMapping[spellFamilyId]);
    }).forEach(spell => {
        const option = document.createElement('option');
        const spellName = spell['Name'] || 'Unnamed Spell';
        const spellId = spell['id'] || 'No ID';
        option.value = spellId;
        option.textContent = `${spellName} (ID: ${spellId})`;
        spellSelect.appendChild(option);
    });

    spellSelect.addEventListener('change', displaySpellDetails);
}

function updateCheckboxes() {
    hidePassives = document.getElementById('hidePassives').checked;
    hideHidden = document.getElementById('hideHidden').checked;
    filterSpellsByClass();
}

function updateClassCheckboxes() {
    const classFilter = document.getElementById('classFilter');
    const classMap = {};

    spells.forEach(spell => {
        const isPassive = spell['Name'] && spell['Name'].toLowerCase().includes('passive');
        const isHidden = spell['Name'] && spell['Name'].toLowerCase().includes('hidden');
        if ((!hidePassives || !isPassive) && (!hideHidden || !isHidden) && spell['Class']) {
            const classes = spell['Class'].split(', ');
            classes.forEach(cls => {
                if (!classMap[cls]) {
                    classMap[cls] = [];
                }
                classMap[cls].push(spell);
            });
        }
    });

    Array.from(classFilter.children).forEach(child => {
        const checkbox = child.querySelector('input[type="checkbox"]');
        if (checkbox) {
            if (classMap[checkbox.id] && classMap[checkbox.id].length > 0) {
                checkbox.disabled = false;
                child.style.display = 'block';
            } else {
                checkbox.disabled = true;
                child.style.display = 'none';
            }
        }
    });
}

function selectUnselectAll() {
    const selectAllBtn = document.getElementById('selectAllBtn');
    const checkboxes = document.querySelectorAll('#classFilter input[type="checkbox"]:not(#hidePassives):not(#hideHidden)');
    const isSelectAll = selectAllBtn.textContent.includes('Select');

    checkboxes.forEach(checkbox => {
        if (!checkbox.disabled) {
            checkbox.checked = isSelectAll;
        }
    });

    selectAllBtn.textContent = isSelectAll ? 'Unselect All' : 'Select All';
    filterSpellsByClass();
}

function copyToClipboard(text, tooltipId) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    const tooltip = document.getElementById(tooltipId);
    tooltip.classList.add('show-tooltip');
    setTimeout(() => {
        tooltip.classList.remove('show-tooltip');
    }, 1000);
}

function copySpellName() {
    const text = document.getElementById('copySpellNameText').value;
    copyToClipboard(text, 'copyNameTooltip');
}

function copySpellId() {
    const text = document.getElementById('copySpellIdText').value;
    copyToClipboard(text, 'copyIdTooltip');
}

function copySpell() {
    const text = document.getElementById('copySpellText').value;
    copyToClipboard(text, 'copyTooltip');
}
