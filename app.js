//Global Selections and Variables
const colorDivs = document.querySelectorAll('.color');
const generateBtn = document.querySelector('.generate');
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexes = document.querySelectorAll('.color h2');
const popup = document.querySelector('.copy-container');
const adjustBtns = document.querySelectorAll('.adjust');
const lockBtns = document.querySelectorAll('.lock');
const closeAdjustments = document.querySelectorAll('.color-adjustment');
const sliderContainers = document.querySelectorAll('.sliders');
let initialColors;

//Add event listener
generateBtn.addEventListener('click', randomColors);
sliders.forEach(slider => {
    slider.addEventListener('input', hslControls);
});
colorDivs.forEach((div, index) => {
    div.addEventListener('change', () => {
        updateTextUI(index);
    })
});
currentHexes.forEach(hex => {
    hex.addEventListener('click', () => {
        copyToClipboard(hex);
    })
})
popup.addEventListener('transitionend', () => {
    const popupBox = popup.children[0];
    popup.classList.remove('active');
    popupBox.classList.remove('active');
})
adjustBtns.forEach((button, index) => {
    button.addEventListener('click', () => {
        openAdjustmentPanel(index);
    })
})
closeAdjustments.forEach((button, index) => {
    button.addEventListener('click', () => {
        closeAdjustmentPanel(index);
    })
})
lockBtns.forEach((button, index) => {
    button.addEventListener('click', e => {
        lockLayer(e, index);
    })
})

//Functions
//Color Generator
function randomColors(){
    initialColors = []; //when runs randomColors(), reset the color array first

    colorDivs.forEach((div, index) => {
        const hexText = div.children[0];
        const randomColor = generateHex();

        //add to array || lock feature
        if(div.classList.contains('locked')){
            initialColors.push(hexText.innerText);
            return;
        }else{
            initialColors.push(chroma(randomColor).hex());
        }
        //apply color to background
        div.style.backgroundColor = randomColor;
        hexText.innerText = randomColor;
        //check for contrast
        checkTextContrast(randomColor, hexText);
        //initial colorize sliders
        const color = chroma(randomColor);
        const sliders = div.querySelectorAll('.sliders input');
        const hue = sliders[0];
        const brightness = sliders[1];
        const saturation = sliders[2];

        colorizeSliders(color, hue, brightness, saturation);
    });

    //reset inputs
    resetInputs();
    //check button contrast
    adjustBtns.forEach((button, index) => {
        checkTextContrast(initialColors[index], button);//check for adjustBtns
        checkTextContrast(initialColors[index], lockBtns[index]);//check for lockBtns
    })
}

function generateHex(){
     //using chroma.js 
    const hexColor = chroma.random();
    return hexColor;

    /*
    const letters = '0123456789ABCDEF';
    let hash = '#';
    for(let i=0; i<6; i++){
        hash += letters[Math.floor(Math.random() * 16)];
    }
    return hash;
    */
}

function checkTextContrast(color,text){
    const luminance = chroma(color).luminance(text);
    if(luminance > .5){ //0 for darkest black and 1 for lightest white.
        text.style.color = 'black';
    }else{
        text.style.color = 'white';
    }
}

function colorizeSliders(color, hue, brightness, saturation){
    //scale saturation
    const noSat = color.set('hsl.s', 0);
    const fullSat = color.set('hsl.s', 1);
    const scaleSat = chroma.scale([noSat, color, fullSat]);
    //scale brightness
    const midBrightness = color.set('hsl.l', .5);
    const scaleBrightness = chroma.scale(['black', midBrightness, 'white']);
    //update input colors
    saturation.style.backgroundImage = `linear-gradient(to right,${scaleSat(0)}, ${scaleSat(1)})`;
    brightness.style.backgroundImage = `linear-gradient(to right,${scaleBrightness(0)}, ${scaleBrightness(.5)}, ${scaleBrightness(1)})`; //if only two values then will get black n white, same to line 62
    hue.style.backgroundImage = `linear-gradient(to right,
        rgb(204, 75, 75),
        rgb(204, 204, 75),
        rgb(204, 204, 204),
        rgb(75, 75, 75),
        rgb(75, 75, 204),
        rgb(75, 204, 204))`;
}

function hslControls(e){
    const index = e.target.getAttribute('data-hue') ||
        e.target.getAttribute('data-brightness') ||
        e.target.getAttribute('data-saturation');

    let sliders = e.target.parentElement.querySelectorAll('input[type="range"]');
    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];

    const bgColor = initialColors[index];

    let color = chroma(bgColor).
        set('hsl.h', hue.value).
        set('hsl.s', saturation.value).
        set('hsl.l', brightness.value);

    colorDivs[index].style.backgroundColor = color;

    //colorize slider inputs
    colorizeSliders(color, hue, brightness, saturation);
}

function updateTextUI(index){
    const activeDiv = colorDivs[index];
    const color = chroma(activeDiv.style.backgroundColor);
    const textHex = activeDiv.querySelector('h2');
    const icons = activeDiv.querySelectorAll('.controls button');
    textHex.innerText = color.hex();//hex(), to output colors in various color spaces and formats in chromas.js

    //check contrast
    checkTextContrast(color, textHex);
    for(icon of icons){
        checkTextContrast(color, icon);
    }
}

function resetInputs(){
    const sliders = document.querySelectorAll('.sliders input');

    sliders.forEach(slider => {
        if(slider.name ==='hue'){
            const hueColor = initialColors[slider.getAttribute('data-hue')];
            const hueValue = chroma(hueColor).hsl()[0];
            slider.value = Math.floor(hueValue);
        }
        if(slider.name === 'brightness'){
            const brightnessColor = initialColors[slider.getAttribute('data-brightness')];
            const brightnessValue = chroma(brightnessColor).hsl()[1];
            slider.value = Math.floor(brightnessValue * 100) / 100;
        }
        if(slider.name === 'saturation'){
            const saturationColor = initialColors[slider.getAttribute('data-saturation')];
            const saturationValue = chroma(saturationColor).hsl()[2];
            slider.value = Math.floor(saturationValue * 100) / 100;
        }
    })
}

function copyToClipboard(hex){
    const el = document.createElement('textarea');
    el.value = hex.innerText;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);//don't need textarea anymore, just use it for copy
    
    //popup animation
    const popupBox = popup.children[0];
    popup.classList.add('active');//the whole screen
    popupBox.classList.add('active');//the actual pop up box

}

function openAdjustmentPanel(index){
    sliderContainers[index].classList.toggle('active');
}

function closeAdjustmentPanel(index){
    sliderContainers[index].classList.remove('active');
}

function lockLayer(e, index){
    const lockSVG = e.target.children[0];
    const activeBg = colorDivs[index];
    activeBg.classList.toggle('locked');

    if(lockSVG.classList.contains('fa-lock-open')){
        e.target.innerHTML = '<i class="fas fa-lock">';
    }else{
        e.target.innerHTML = '<i class="fas fa-lock-open"</i>'
    }
}

//implement save palette and local storage
const saveBtn = document.querySelector('.save');
const saveSubmit = document.querySelector('.save-submit');
const saveClose = document.querySelector('.save-close');
const saveContainer = document.querySelector('.save-container');
const saveInput = document.querySelector('.save-container input');
const libraryContainer = document.querySelector('.library-container');
const libraryOpen = document.querySelector('.library');
const libraryClose = document.querySelector('.library-close');
let savedPalettes = []; // for local storage

//event listeners
saveBtn.addEventListener('click', openPalette);
saveClose.addEventListener('click', closePalette);
saveSubmit.addEventListener('click', savePalette);
libraryOpen.addEventListener('click', openLibrary);
libraryClose.addEventListener('click', closeLibrary);
//function
function openPalette(e){
    const popup = saveContainer.children[0];
    saveContainer.classList.add('active');
    popup.classList.add('active');
}

function closePalette(e){
    const popup = saveContainer.children[0];
    saveContainer.classList.remove('active');
    popup.classList.add('remove');
}

function savePalette(e){
    saveContainer.classList.remove('active');
    popup.classList.remove('active');
    const name = saveInput.value;
    const colors = [];
    currentHexes.forEach(hex => {
        colors.push(hex.innerText);
    });

    //generate objects
    let paletteNum;
    const paletteObjects = JSON.parse(localStorage.getItem('palettes'));
    if(paletteObjects){
        paletteNum = paletteObjects.length;
    }else{
        paletteNum = savedPalettes.length;
    }

    const paletteObj = {name, colors, num: paletteNum};
    savedPalettes.push(paletteObj);

    //save to local storage
    saveToLocal(paletteObj);
    saveInput.value = '';

    //generate the stored palette for library
    const palette = document.createElement('div');
    palette.classList.add('custom-palette');
    const title = document.createElement('h4');
    title.innerText = paletteObj.name;
    const preview = document.createElement('div');
    preview.classList.add('small-preview');
    paletteObj.colors.forEach(smallColor => {
        const smallDiv = document.createElement('div');
        smallDiv.style.backgroundColor = smallColor;
        preview.appendChild(smallDiv);
        })
    const paletteBtn = document.createElement('button');
    paletteBtn.classList.add('pick-palette-button');
    paletteBtn.classList.add(paletteObj.num);
    paletteBtn.innerText = 'Select';

    //attach event to the button
    paletteBtn.addEventListener('click', e => {
        closeLibrary();
        const paletteIndex = e.target.classList[1];
        initialColors = [];
        savedPalettes[paletteIndex].colors.forEach((color, index) => {
            initialColors.push(color);
            colorDivs[index].style.backgroundColor = color;
            const text = colorDivs[index].children[0];
            checkTextContrast(color, text);
            updateTextUI(index);
        })
        resetInputs();
    })

    //append to library
    palette.appendChild(title);
    palette.appendChild(preview);
    palette.appendChild(paletteBtn);
    libraryContainer.children[0].appendChild(palette);
}

function saveToLocal(paletteObj){
    let localPalettes;

    if(localStorage.getItem('palettes') === null){ //if palettes doesn't exist
        localPalettes = []; //create an empty array
    }else{
        localPalettes = JSON.parse(localStorage.getItem('palettes')); //if it's there, give the data back
    }
    localPalettes.push(paletteObj);
    localStorage.setItem('palettes', JSON.stringify(localPalettes));
}

function openLibrary(){
    const popup = libraryContainer.children[0];
    libraryContainer.classList.add('active');
    popup.classList.add('active');
}

function closeLibrary(){
    const popup = libraryContainer.children[0];
    libraryContainer.classList.remove('active');
    popup.classList.remove('active');
}

function getLocal(){
    if(localStorage.getItem('palettes') === null){
        localPalettes = [];
    }else{
        const paletteObjects = JSON.parse(localStorage.getItem('palettes'));
        savedPalettes = [...paletteObjects]
        paletteObjects.forEach(paletteObj => {

        //generate the stored palette for library
        const palette = document.createElement('div');
        palette.classList.add('custom-palette');
        const title = document.createElement('h4');
        title.innerText = paletteObj.name;
        const preview = document.createElement('div');
        preview.classList.add('small-preview');
        paletteObj.colors.forEach(smallColor => {
            const smallDiv = document.createElement('div');
            smallDiv.style.backgroundColor = smallColor;
            preview.appendChild(smallDiv);
            })
        const paletteBtn = document.createElement('button');
        paletteBtn.classList.add('pick-palette-button');
        paletteBtn.classList.add(paletteObj.num);
        paletteBtn.innerText = 'Select';

        //attach event to the button
        paletteBtn.addEventListener('click', e => {
            closeLibrary();
            const paletteIndex = e.target.classList[1];
            initialColors = [];
            paletteObjects[paletteIndex].colors.forEach((color, index) => {
                initialColors.push(color);
                colorDivs[index].style.backgroundColor = color;
                const text = colorDivs[index].children[0];
                checkTextContrast(color, text);
                updateTextUI(index);
            })
            resetInputs();
    })

    //append to library
    palette.appendChild(title);
    palette.appendChild(preview);
    palette.appendChild(paletteBtn);
    libraryContainer.children[0].appendChild(palette);  
        })
    }
        
}
localStorage.clear();//clear all stored color palettes

getLocal();
randomColors();
