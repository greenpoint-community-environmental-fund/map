var map;
var projectData;
var geoJsonLayer;

var filters = {
    category: null,
    lead: null,
    minAmount: null,
    maxAmount: null,
    status: 'all'
};

function initializeAmountInput(minAmount, maxAmount) {
    var amountInput = document.getElementsByClassName('filter-amount')[0];
    noUiSlider.create(amountInput, {
        start: [minAmount, maxAmount],
        connect: true,
        range: {
            min: minAmount,
            max: maxAmount
        },
        step: 1000
    });

    var minAmountDisplay = document.getElementsByClassName('min-amount-display')[0];
    var maxAmountDisplay = document.getElementsByClassName('max-amount-display')[0];
    amountInput.noUiSlider.on('update', function () {
        var currentValues = amountInput.noUiSlider.get();
        filters.minAmount = currentValues[0];
        filters.maxAmount = currentValues[1];

        minAmountDisplay.innerText = parseFloat(filters.minAmount).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        });
        maxAmountDisplay.innerText = parseFloat(filters.maxAmount).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        });
        updateFilters();
    });
}

function initializeCategoryInput(categories) {
    var categoryInput = document.getElementsByClassName('filter-category')[0];
    categories.forEach(function (category) {
        var option = document.createElement('option');
        option.innerText = category;
        categoryInput.appendChild(option);
    });
    categoryInput.addEventListener('change', function (e) {
        var selected = e.target.options.item(e.target.options.selectedIndex);
        filters.category = selected.innerText === 'Show all' ? null : selected.innerText;
        updateFilters();
    });
}

function hideGreenpointWidePopups() {
    // Find and hide popups
    var greenpointWideList = document.getElementsByClassName('greenpoint-wide-list')[0];
    var currentPopup = greenpointWideList.getElementsByClassName('greenpoint-wide-popup')[0];
    if (currentPopup) {
        greenpointWideList.removeChild(currentPopup);
    }

    // Find active dots and deactivate them
    document.querySelectorAll('.project.active').forEach(function (projectDot) {
        removeClass(projectDot, 'active');
    });
}

function openGreenpointWidePopup(projectDot, project) {
    var greenpointWideList = document.getElementsByClassName('greenpoint-wide-list')[0];
    var popup = document.createElement('div');
    popup.innerHTML = document.getElementById('popup-template').innerHTML;
    addClass(popup, 'greenpoint-wide-popup');
    addClass(popup, 'leaflet-popup');
    greenpointWideList.append(popup);

    var popupContents = document.createElement('div');
    popupContents.innerHTML = document.getElementById('popup-inner-template').innerHTML;
    fillPopupTemplate(popupContents, project.properties);
    popup.getElementsByClassName('leaflet-popup-content')[0].innerHTML = popupContents.innerHTML;

    var popupStyle = getComputedStyle(popup);
    var dotStyle = getComputedStyle(projectDot);

    // Adjust left style on popup to get it over the dot clicked
    if (document.body.clientWidth > 600) {
        // Style popup over dot when larger than phone
        popup.style.left = (projectDot.offsetLeft - (parseFloat(popupStyle.width) / 2) + (parseFloat(dotStyle.width) / 2) + (-parseFloat(popupStyle.marginLeft))) + 'px';
    } else {
        // Style popup above bar when phone or smaller
        popup.style.left = ((document.body.clientWidth / 2) - (parseFloat(popupStyle.width) / 2)) + 'px';
        popup.style.bottom = '80px';
    }

    popup.getElementsByClassName('leaflet-popup-close-button')[0].addEventListener('click', function (e) {
        e.preventDefault();
        hideGreenpointWidePopups();
    });
}

function initializeGreenpointWideBar(projects) {
    var greenpointWideList = document.getElementsByClassName('greenpoint-wide-list')[0];
    projects.forEach(function (project) {
        var projectDot = document.createElement('li');
        addClass(projectDot, 'project');

        projectDot.dataset.category = project.properties.Category;
        projectDot.dataset.lead = project.properties['Project Lead'];
        projectDot.dataset.amount = project.properties.fixedAmount;
        projectDot.dataset.status = project.properties.Status;

        projectDot.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove any current popups
            map.closePopup();
            hideGreenpointWidePopups();

            addClass(projectDot, 'active');
            openGreenpointWidePopup(projectDot, project);
        });
        greenpointWideList.appendChild(projectDot);
    });

    var greenpointWideCount = document.getElementsByClassName('greenpoint-wide-count')[0];
    greenpointWideCount.innerText = projects.length;
}

function initializeGreenpointWideButtons() {
    var yesButton = document.getElementsByClassName('greenpoint-wide-yes')[0];
    var noButton = document.getElementsByClassName('greenpoint-wide-no')[0];
    var greenpointWideBar = document.getElementsByClassName('greenpoint-wide-bar')[0];

    yesButton.addEventListener('click', function (e) {
        e.preventDefault();
        addClass(yesButton, 'enabled');
        removeClass(noButton, 'enabled');
        addClass(greenpointWideBar, 'enabled');
    });

    noButton.addEventListener('click', function (e) {
        e.preventDefault();
        addClass(noButton, 'enabled');
        removeClass(yesButton, 'enabled');
        removeClass(greenpointWideBar, 'enabled');
        hideGreenpointWidePopups();
    });
}

function addClass(element, className) {
    if (element.classList) {
        element.classList.add(className);
    } else {
      element.className += ' ' + className;
    }
}

function removeClass(element, className) {
    if (element.classList) {
        element.classList.remove(className);
    } else {
        element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
}

function initializeLeadInput(leads) {
    var leadInput = document.getElementsByClassName('filter-lead')[0];
    leads.forEach(function (lead) {
        var option = document.createElement('option');
        option.innerText = lead;
        leadInput.appendChild(option);
    });
    leadInput.addEventListener('change', function (e) {
        var selected = e.target.options.item(e.target.options.selectedIndex);
        filters.lead = selected.innerText === 'Show all' ? null : selected.innerText;
        updateFilters();
    });
}

function initializeProjectStatusInput() {
    document.querySelectorAll('input[name=project-status]').forEach(function(statusInput) {
        statusInput.addEventListener('change', function () {
            filters.status = statusInput.value;
            updateFilters();
        });
    });
}

function fillPopupTemplate(element, featureProperies) {
    element.getElementsByClassName('leaflet-popup-image')[0].src = featureProperies['Image URL'];
    var popupName = element.getElementsByClassName('leaflet-popup-name')[0];
    popupName.href = ('http://gcefund.org/#portfolio-' + featureProperies['id']);
    popupName.innerText = featureProperies['Project Name'];
    element.getElementsByClassName('leaflet-popup-project-lead')[0].innerText = featureProperies['Project Lead'];
}

function initializeMapLayer(projectData) {
    var filteredProjectData = JSON.parse(JSON.stringify(projectData));
    filteredProjectData.features = filteredProjectData.features.filter(function (feature) {
        return feature.properties['Greenpoint Wide'] !== 'yes';
    });
    geoJsonLayer = L.geoJson(filteredProjectData, {
        onEachFeature: function (feature, layer) {
            var popupContents = document.createElement('div');
            popupContents.innerHTML = document.getElementById('popup-inner-template').innerHTML;
            fillPopupTemplate(popupContents, feature.properties);
            layer.bindPopup(popupContents);

            layer.on({
                popupopen: function () {
                    hideGreenpointWidePopups();
                    layer.setStyle({ fillColor: '#70bf52' });
                },
                popupclose: function () {
                    layer.setStyle({ fillColor: '#231f20' });
                }
            });
        },

        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng);
        },

        style: function (feature) {
            return {
                fillColor: '#231f20',
                fillOpacity: 0.8,
                stroke: false
            };
        }
    })
        .addTo(map);
    map.fitBounds(geoJsonLayer.getBounds());
}

function updateFilters() {
    // Dismiss neighborhood-wide popups when filters change
    hideGreenpointWidePopups();

    if (!geoJsonLayer) return;
    geoJsonLayer.eachLayer(function (layer) {
        var properties = layer.feature.properties;

        if (filters.category && !(properties.Category === filters.category)) {
            layer.removeFrom(map);
        } else if (filters.lead && !(properties['Project Lead'] === filters.lead)) {
            layer.removeFrom(map);
        } else if (filters.minAmount && properties.fixedAmount < filters.minAmount) {
            layer.removeFrom(map);
        } else if (filters.maxAmount && properties.fixedAmount > filters.maxAmount) {
            layer.removeFrom(map);
        } else if (filters.status !== 'all' && properties.Status !== filters.status) {
            layer.removeFrom(map);
        } else {
            layer.addTo(map);
        }
    });

    var greenpointWideFiltered = 0;
    document.querySelectorAll('.project').forEach(function (projectDot) {
        if (filters.category && !(projectDot.dataset.category === filters.category)) {
            addClass(projectDot, 'filter-excluded');
        } else if (filters.lead && !(projectDot.dataset.lead === filters.lead)) {
            addClass(projectDot, 'filter-excluded');
        } else if (filters.minAmount && parseInt(projectDot.dataset.amount) < filters.minAmount) {
            addClass(projectDot, 'filter-excluded');
        } else if (filters.maxAmount && parseInt(projectDot.dataset.amount) > filters.maxAmount) {
            addClass(projectDot, 'filter-excluded');
        } else if (filters.status !== 'all' && projectDot.dataset.status !== filters.status) {
            addClass(projectDot, 'filter-excluded');
        } else {
            removeClass(projectDot, 'filter-excluded');
            greenpointWideFiltered++;
        }
    });

    var greenpointWideCount = document.getElementsByClassName('greenpoint-wide-count')[0];
    greenpointWideCount.innerText = greenpointWideFiltered;
}

$(document).ready(function () {
    map = L.map('map').setView([40.72, -73.95], 13);
    L.tileLayer('https://api.mapbox.com/styles/v1/gcefund/{mapId}/tiles/256/{z}/{x}/{y}?access_token={accessToken}', {
        accessToken: 'pk.eyJ1IjoiZ2NlZnVuZCIsImEiOiJjaWhwaXJhdDEwNDVldXJseHZxcG9tdjVkIn0.YkR7jTjQ9W2UO1F6N1nxRw',
        attribution: '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        maxZoom: 18,
        mapId: 'cita4hjan000a2ip692f15ujo'
    }).addTo(map);

    map.on('click', function () {
        hideGreenpointWidePopups();
    });

    $.getJSON('https://raw.githubusercontent.com/greenpoint-community-environmental-fund/project-map-data/master/projects.geojson', function (data) {
        projectData = data;

        var categories = [];
        var leads = [];
        var minAmount;
        var maxAmount;

        projectData.features.forEach(function (project) {
            var category = project.properties.Category;
            if (category && categories.indexOf(category) === -1) {
                categories.push(category);
            }

            var lead = project.properties['Project Lead'];
            if (lead && leads.indexOf(lead) === -1) {
                leads.push(lead);
            }

            var amount = project.properties['GCEF Grant Money'];
            amount = project.properties.fixedAmount = parseFloat(amount.replace(/\$|,/g, ''));
            if (!minAmount || amount < minAmount) minAmount = amount;                       
            if (!maxAmount || amount > maxAmount) maxAmount = amount;                       
        });

        categories.sort();
        leads.sort();
        filters.minAmount = minAmount;
        filters.maxAmount = maxAmount;

        var greenpointWideProjects = projectData.features.filter(function (project) {
            return project.properties['Greenpoint Wide'] === 'yes';
        });

        initializeAmountInput(minAmount, maxAmount);
        initializeCategoryInput(categories);
        initializeGreenpointWideBar(greenpointWideProjects);
        initializeGreenpointWideButtons();
        initializeLeadInput(leads);
        initializeMapLayer(projectData);
        initializeProjectStatusInput();
    });
});

