"use strict";

const GET_COOKIE = "getCookie";
const LOCALE_ERROR = "error";
const LOCALE_RU = "ru";
const CHILD_LIST = "childList";
const INITIAL_TOOLBAR_ITEMS_COUNT = 6;
const COOKIE_URL = "https://pastvu.com";
const COOKIE_NAME = "past_lang";

const TOOLBAR_SELECTOR = ".trtools";
const TOOLTIP_CLASS = "tltp";
const TOOLTIP_WRAPPER_CLASS = "tltp-wrap";
const TOOLBAR_BUTTON_CLASS = "trtool fringe-base fringe-button";
const TOOLBAR_BUTTON_TEXT_CLASS = "fringe-button-text";
const TOOLTIP_TEXT_CLASS = "tltp tltp-bottom tltp-animate-opacity";
const TOOLTIP_ROLE = "tooltip";
const TOOLTIP_STYLE_BLOCK = "block";
const TOOLTIP_STYLE_NONE = "none";

const DECADE_SELECTOR_ID = "decade-selector";
const FRINGE_LIST_CLASS = "fringe-base fringe-list";
const DECADE_ITEM_CLASS = "decade-item";

const STORAGE_IS_PAINTING = "map.isPainting";
const STORAGE_YEAR_1 = "map.year.1";
const STORAGE_YEAR2_1 = "map.year2.1";

const DEFAULT_DECADE_TEXT_EN = "----s";
const DEFAULT_DECADE_TEXT_RU = "----е";

let locale = '';

doAfterPageLoaded();

function doAfterPageLoaded() {
    getLanguageCodeFromCookies((success) => {
        if (!success) {
            locale = LOCALE_ERROR;
        }
        observeForToolbarInjection();
    });
}

function observeForToolbarInjection() {
    const observer = new MutationObserver(function(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if (mutation.type === CHILD_LIST) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const newElement = document.querySelector(TOOLBAR_SELECTOR);
                        if (shouldInjectToolbar(newElement)) {
                            injectToolbar(newElement);
                            observer.disconnect();
                        }
                    }
                });
            }
        }
    });

    const config = {
        childList: true,
        attributes: false,
        subtree: true
    };

    observer.observe(document.body, config);
}

function shouldInjectToolbar(element) {
    return element?.children?.length === INITIAL_TOOLBAR_ITEMS_COUNT;
}

function injectToolbar(container) {
    const originalChildren = Array.from(container.children);
    container.innerHTML = ''; // remove all children

    const tooltipWrapper = document.createElement('span');
    tooltipWrapper.className = TOOLTIP_WRAPPER_CLASS;

    const buttonDiv = createToolbarButton(tooltipWrapper);
    const tooltipDiv = createTooltipDiv();

    tooltipWrapper.appendChild(buttonDiv);
    tooltipWrapper.appendChild(tooltipDiv);
    container.appendChild(tooltipWrapper);

    originalChildren.forEach(child => container.appendChild(child));
}

function createToolbarButton(tooltipWrapper) {
    const buttonDiv = document.createElement('div');
    buttonDiv.className = TOOLBAR_BUTTON_CLASS;

    const buttonTextDiv = document.createElement('div');
    buttonTextDiv.className = TOOLBAR_BUTTON_TEXT_CLASS;
    buttonTextDiv.textContent = getButtonText();

    buttonDiv.appendChild(buttonTextDiv);

    let isListShown = false;

    buttonDiv.addEventListener('click', () => {
        if (isListShown) {
            removeDecadeSelector();
            showTooltip(tooltipWrapper);
            isListShown = false;
        } else {
            hideTooltip(tooltipWrapper);
            showDecadeSelector(buttonTextDiv, tooltipWrapper);
            isListShown = true;
        }
    });

    return buttonDiv;
}

function createTooltipDiv() {
    const tooltipDiv = document.createElement('div');
    tooltipDiv.className = TOOLTIP_TEXT_CLASS;
    tooltipDiv.setAttribute('role', TOOLTIP_ROLE);
    tooltipDiv.textContent = tryToGetLocalizedString('Decade', 'Декада');
    return tooltipDiv;
}

function getButtonText() {
    const firstYear = localStorage.getItem(STORAGE_YEAR_1);
    const lastYear = localStorage.getItem(STORAGE_YEAR2_1);

    if (firstYear) {
        const yearNum = parseInt(firstYear, 10);
        const rem = yearNum % 10;
        const lastNum = parseInt(lastYear, 10);

        if (rem === 0 && (lastNum - yearNum === 9)) {
            return formDecadeName(yearNum);
        }
    } else if (lastYear === '1829') {
        return formDecadeName(1820);
    }

    return tryToGetLocalizedString(DEFAULT_DECADE_TEXT_EN, DEFAULT_DECADE_TEXT_RU);
}

function removeDecadeSelector() {
    const selector = document.getElementById(DECADE_SELECTOR_ID);
    if (selector) document.body.removeChild(selector);
}

function showTooltip(wrapper) {
    const tooltip = wrapper.querySelector(`.${TOOLTIP_CLASS}`);
    if (tooltip) {
        tooltip.className = TOOLTIP_TEXT_CLASS;
        tooltip.style.display = TOOLTIP_STYLE_BLOCK;
    }
}

function hideTooltip(wrapper) {
    const tooltip = wrapper.querySelector(`.${TOOLTIP_CLASS}`);
    if (tooltip) {
        tooltip.className = '';
        tooltip.style.display = TOOLTIP_STYLE_NONE;
    }
}

function showDecadeSelector(buttonTextDiv, wrapper) {
    const parentDiv = document.createElement('div');
    parentDiv.className = FRINGE_LIST_CLASS;
    parentDiv.id = DECADE_SELECTOR_ID;

    appendDecades(parentDiv, buttonTextDiv);

    const pos = wrapper.getBoundingClientRect();
    parentDiv.style.top = `${pos.bottom + 4}px`;
    parentDiv.style.left = `${pos.left + 2}px`;

    document.body.appendChild(parentDiv);
}

function getLanguageCodeFromCookies(callback) {
    chrome.runtime.sendMessage(
        { action: GET_COOKIE, url: COOKIE_URL, name: COOKIE_NAME },
        (response) => {
            if (chrome.runtime.lastError) {
                console.warn('Cookie request failed:', chrome.runtime.lastError);
                callback(false);
            } else if (response?.error) {
                callback(false);
            } else {
                locale = response.value;
                callback(true);
            }
        }
    );
}

function formDecadeName(year) {
    return year + tryToGetLocalizedString('s', '-е');
}

function tryToGetLocalizedString(english, russian) {
    if (locale === LOCALE_ERROR) {
        return english;
    } else {
        if (locale === LOCALE_RU) {
            return russian;
        } else {
            return english;
        }
    }
}

function appendDecades(parent, buttonTextDiv) {

    function appendDecade(parent, buttonTextDiv, name, firstYear, lastYear) {
        const newDiv = document.createElement('div');
        newDiv.classList.add(DECADE_ITEM_CLASS);

        const decadeName = formDecadeName(name);
        newDiv.textContent = decadeName;

        newDiv.addEventListener('click', function () {
            buttonTextDiv.textContent = decadeName;
            localStorage.setItem(STORAGE_IS_PAINTING, 'false');
            localStorage.setItem(STORAGE_YEAR_1, firstYear);
            localStorage.setItem(STORAGE_YEAR2_1, lastYear);
            location.reload();
        });

        parent.appendChild(newDiv);
    }

    const DECADES = [
        { label: '1820', from: 1826, to: 1829 },
        { label: '1830', from: 1830, to: 1839 },
        { label: '1840', from: 1840, to: 1849 },
        { label: '1850', from: 1850, to: 1859 },
        { label: '1860', from: 1860, to: 1869 },
        { label: '1870', from: 1870, to: 1879 },
        { label: '1880', from: 1880, to: 1889 },
        { label: '1890', from: 1890, to: 1899 },
        { label: '1900', from: 1900, to: 1909 },
        { label: '1910', from: 1910, to: 1919 },
        { label: '1920', from: 1920, to: 1929 },
        { label: '1930', from: 1930, to: 1939 },
        { label: '1940', from: 1940, to: 1949 },
        { label: '1950', from: 1950, to: 1959 },
        { label: '1960', from: 1960, to: 1969 },
        { label: '1970', from: 1970, to: 1979 },
        { label: '1980', from: 1980, to: 1989 },
        { label: '1990', from: 1990, to: 1999 },
    ];

    DECADES.reverse().forEach(({ label, from, to }) => {
        appendDecade(parent, buttonTextDiv, label, from, to);
    });
}