const languages = ["USA / CA","AU / IE / UK","DE / CH","FR","NL","SE","ES/MX","NO","DK","IT","FI"];
var baseURL = 'https://raw.githubusercontent.com/levente-tg/levente-tg.github.io/main/sources/';

var supportedLang = {
    "USA / CA" : true,
    "AU / IE / UK" : true,
    "DE / CH" : true,
    "FR" : false,
    "NL" : false,
    "SE" : false,
    "ES/MX" : false,
    "NO" : false,
    "DK" : false,
    "IT" : false,
    "FI" : false
}

var genderedLang = {
    "USA / CA" : false,
    "AU / IE / UK" : false,
    "DE / CH" : true,
    "FR" : false,
    "NL" : false,
    "SE" : false,
    "ES/MX" : false,
    "NO" : false,
    "DK" : false,
    "IT" : false,
    "FI" : false
}

// melyik option van hatással a többire
var modifierOption = {
    "DE / CH" : "ProductType"
}

var options = [
    "Personalization",
    "ProductDesign",
    "ProductType",
    "ProductComponents",
    "Carats",
    "StoneType",
    "MaterialType",
    "Audience"
];

var csvURLs =  {};
var csvData = {};
var csvArray = [];


function loadCSV(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load CSV file: ' + response.status);
            }
            return response.text();
        })
        .catch(error => {
            console.error(error);
        });
}

function csvToArray(csv) {
    var rows = csv.split('\n');
    var result = [];
    
    rows.forEach(function(row) {
        var cells = row.split(';');
        result.push(cells);
    });
    
    return result;
}

function populateSelector(data, id) {
    var selector = document.getElementById(id);
    selector.innerHTML = '';

    data.forEach(function(row, index) {
        if (index === 0) return; 
        var optionElement = document.createElement('option');
        optionElement.textContent = row[0]; // First column (eng/us)
        selector.appendChild(optionElement);
    });
}

function showResult(data) {
    var resultTable = document.querySelector('#resultTable tbody');
    resultTable.innerHTML = '';

    data.forEach(function(rowData) {
        var row = document.createElement('tr');

        rowData.forEach(function(cellData) {
            var cell = document.createElement('td');
            cell.textContent = cellData;
            row.appendChild(cell);
        });

        var extraCell = document.createElement('td');
        var button = document.createElement('button');
        button.textContent = 'Copy';
        button.onclick = function() {
            copyToClipboard(this);
        };
        
        extraCell.appendChild(button);
        row.appendChild(extraCell);

        resultTable.appendChild(row);
    });
};

function copyToClipboard(button) {
    var row = button.parentNode.parentNode;
    var textarea = document.createElement('textarea');
    var cells = row.getElementsByTagName("td");
    var secondColumn = cells[1];
    textarea.value = secondColumn.innerText.trim();
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}


function getOptionTemp(option) {
    var optionTemp = csvToArray(csvData[option]);
    // Remove linebreak from last element (FI)
    optionTemp[0][optionTemp[0].length - 1] = optionTemp[0][optionTemp[0].length - 1].trim();
    return optionTemp;
}

function findSelectedIndex(optionTemp, option, formData) {
    var selectedIndex = 0;
    optionTemp.forEach(function(row, index) {
        if (row[0].trim() === formData.get(option)) {
            selectedIndex = index;
        }
    });
    return selectedIndex;
}

// Generator functions
function genderedGen(language, formData) {
    var nameTemp = [language];
    var generatedTemp = formData.get('freeText');
    var genderVariable;

    //Get gender variable
    options.forEach(function(option) {
        var optionTemp = getOptionTemp(option);
        var languageIndex = optionTemp[0].indexOf(language);
        var selectedIndex = findSelectedIndex(optionTemp, option, formData);

        if (option === modifierOption[language]) {
            var splitTemp = optionTemp[selectedIndex][languageIndex].split('@');
            genderVariable = splitTemp[0];
            console.log("GenderVariable: " + genderVariable);
        }
    });

    //Generate
    options.forEach(function(option) {
        var optionTemp = getOptionTemp(option);
        var languageIndex = optionTemp[0].indexOf(language);
        var selectedIndex = findSelectedIndex(optionTemp, option, formData);
        var selectedText = optionTemp[selectedIndex][languageIndex];

        if (selectedText != undefined){
            if (selectedText.includes('#')) {
                selectedText.split('#').forEach(function(part) {
                    var splitPart = part.split('@');
                    if (splitPart[0] === genderVariable) {
                        generatedTemp += ' ' + splitPart[1];
                    }
                });
            } else if (selectedText.includes('@')) {
                var splitTemp = selectedText.split('@');
                generatedTemp += ' ' + splitTemp[1];
            } else {
                generatedTemp += ' ' + selectedText;
            }
            };
        });
    

    nameTemp.push(generatedTemp);
    return nameTemp;
}

function genderlessGen(language, formData) {
    var nameTemp = [language];
    var generatedTemp = formData.get('freeText');

    options.forEach(function(option) {
        var optionTemp = getOptionTemp(option);
        var languageIndex = optionTemp[0].indexOf(language);
        var selectedIndex = findSelectedIndex(optionTemp, option, formData);
        if (optionTemp[selectedIndex][languageIndex] != undefined) {
            generatedTemp += ' ' + optionTemp[selectedIndex][languageIndex];
        }
        
    });

    nameTemp.push(generatedTemp);
    return nameTemp;
}
// EO Generator functions


function generateName(formData) {
    var generatedNames = [];

    languages.forEach(function(language) {
        if(supportedLang[language]){
            if(genderedLang[language]) generatedNames.push(genderedGen(language, formData));
            else generatedNames.push(genderlessGen(language, formData));
        };
    });

    showResult(generatedNames);
}

function main() {

    options.forEach(function(option) {
        csvURLs[option] = baseURL + option + '.csv';
    });
    
    var promises = Object.keys(csvURLs).map(key => {
        var url = csvURLs[key];
        return loadCSV(url)
            .then(csvContent => {
                csvData[key] = csvContent;
            });
    });

    Promise.all(promises)
        .then(() => {
            // CSV loaded from now on, hopefully
            options.forEach(function(option) {
                populateSelector(csvToArray(csvData[option]), option);
            });
        })
        .catch(error => {
            console.error("Error loading CSV files:", error);
        });
    
    // Submit listener
    document.querySelector('form').addEventListener('submit', function(event) {
        event.preventDefault();
        var formData = new FormData(event.target); 
        generateName(formData);
    });
}

main();
