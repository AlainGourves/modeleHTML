const canvas = document.querySelector('.box canvas');
const ctx = canvas.getContext('2d');
const img = new Image();
// img.src = '/img/gradient.png';
//  img.src = '/img/gray.png';
img.src = '/img/Lenna.png';
// img.src = '/img/david.jpg';

const histo = document.querySelector('#histogram__container');
const ctxHisto = histo.getContext('2d');
histo.width = 130;
histo.height = 143;
let histImageData = ctxHisto.getImageData(0, 0, histo.width, histo.height);

const btnFlip = document.querySelector('#flip');
const btnGray = document.querySelector('#gray');
const btnFilter = document.querySelector('#filter');
const btnFloyd = document.querySelector('#floyd');
const btnAtkinson = document.querySelector('#atkinson');
const btnDownload = document.querySelector('button#download');
const btnReload = document.querySelector('button#reload');

const filtersMenu = document.querySelector('#filters');

const matrixInputs = document.querySelectorAll('#matrixInputs [type=text');

let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
let data;

let steps = 1; // final number of colors - 1

const filters = [{
        name: 'Gauss',
        matrix: [1, 2, 1,
            2, 4, 2,
            1, 2, 1
        ]
    },

    {
        name: 'Sharpen',
        matrix: [0, -1, 0,
            -1, 5, -1,
            0, -1, 0
        ]
    },

    {
        name: 'Outline',
        matrix: [1, 0, -1,
            0, 0, 0,
            -1, 0, 1
        ]
    },

    {
        name: 'Emboss',
        matrix: [-2, -1, 0,
            -1, 1, 1,
            0, 1, 2
        ]
    }
];

const loadFilter = function (name) {
    let thefilter = filters.find(f => f.name === name);
    matrixInputs.forEach((el, idx) => {
        el.value = thefilter.matrix[idx]
    })
}

const getMatrix = function () {
    let arr = [];
    matrixInputs.forEach(i => arr.push(parseFloat(i.value)));
    return arr;
}

const flip = function () {
    let t1 = Date.now()
    let bob = new ImageData(canvas.width, canvas.height);
    let total = data.length - 1;
    for (let i = total; i >= 0; i -= 4) {
        bob.data[total - i] = data[i - 3]; // rouge
        bob.data[total - i + 1] = data[i - 2]; // vert
        bob.data[total - i + 2] = data[i - 1]; // bleu
        bob.data[total - i + 3] = 255; // alpha
    }
    ctx.putImageData(bob, 0, 0);
    let t2 = Date.now()
    console.log(t2 - t1)
    data = bob.data;
}


// for grayscale conversion algorithms, see = https://tannerhelland.com/2011/10/01/grayscale-image-algorithm-vb6.html
const gray = function () {
    let t1 = Date.now()
    let bob = new ImageData(canvas.width, canvas.height);
    for (let i = 0; i < data.length; i += 4) {
        // averaging RGB values
        // let avg = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3);

        // based on human perception
        let avg = Math.floor((data[i] * .3) + (data[i + 1] * .59) + (data[i + 2] * .11));
        bob.data[i] = avg; // rouge
        bob.data[i + 1] = avg; // vert
        bob.data[i + 2] = avg; // bleu
        bob.data[i + 3] = 255; // alpha
    }
    ctx.putImageData(bob, 0, 0);
    let t2 = Date.now()
    console.log(t2 - t1)
    data = bob.data;
    histogram();
}

const filter = function () {
    let t1 = Date.now()
    let bob = new ImageData(canvas.width, canvas.height);
    // reprend le contour de l'original
    for (let i = 0; i < canvas.width * 4; i++) {
        // première ligne :
        bob.data[i] = data[i];
        bob.data[i + 1] = data[i + 1];
        bob.data[i + 2] = data[i + 2];
        bob.data[i + 3] = data[i + 3];
        // dernière ligne :
        const start = (canvas.width * (canvas.height - 1)) * 4
        bob.data[start + i] = data[start + i];
        bob.data[start + i + 1] = data[start + i + 1];
        bob.data[start + i + 2] = data[start + i + 2];
        bob.data[start + i + 3] = data[start + i + 3];
    }
    for (let i = 1; i < (canvas.height * 4) - 1; i++) {
        const w = canvas.width * 4;
        // première colonne :
        bob.data[i * w] = data[i * w];
        bob.data[i * w + 1] = data[i * w + 1];
        bob.data[i * w + 2] = data[i * w + 2];
        bob.data[i * w + 3] = data[i * w + 3];
        // dernière colonne :
        bob.data[(i * w) + (w - 1)] = data[(i * w) + (w - 1)];
        bob.data[(i * w) + (w - 1) + 1] = data[(i * w) + (w - 1) + 1];
        bob.data[(i * w) + (w - 1) + 2] = data[(i * w) + (w - 1) + 2];
        bob.data[(i * w) + (w - 1) + 3] = data[(i * w) + (w - 1) + 3];
    }
    let matrix = getMatrix();
    let reducer = (prev, next) => prev + next;
    let div = matrix.reduce(reducer);
    for (let j = 1; j < canvas.height; j++) {
        for (let i = 1; i < canvas.width; i++) {
            let idx = index(i, j);
            bob.data[idx] = convol(data, idx, matrix, div);
            bob.data[idx + 1] = convol(data, idx + 1, matrix, div);
            bob.data[idx + 2] = convol(data, idx + 2, matrix, div);
            bob.data[idx + 3] = 255;
        }
    }
    ctx.putImageData(bob, 0, 0);
    data = bob.data;
    let t2 = Date.now()
    console.log(t2 - t1)
    histogram();
}

const floyd = function () {
    let t1 = Date.now();
    let result = new ImageData(canvas.width, canvas.height);
    let error = new ImageData(canvas.width, canvas.height);
    error.data.set(data); // copy the original array to store error diffusion
    result.data.fill(255);
    for (let j = 1; j < canvas.height; j++) {
        for (let i = 1; i < canvas.width; i++) {
            let idx = index(i, j);
            for (let n = 0; n < 3; n++) {
                let oldVal = error.data[idx + n];
                // let newVal = Math.round(oldVal / 255) * 255; // round donne 0 ou 1
                let newVal = findClosestColor(oldVal, steps);
                result.data[idx + n] = newVal;
                // error diffusion
                let err = oldVal - newVal;
                error.data[index(i + 1, j) + n] += err * (7 / 16);
                error.data[index(i - 1, j + 1) + n] += err * (3 / 16);
                error.data[index(i, j + 1) + n] += err * (5 / 16);
                error.data[index(i + 1, j + 1) + n] += err * (1 / 16);
            }
        }
    }
    ctx.putImageData(result, 0, 0);
    data = result.data;
    let t2 = Date.now()
    console.log(t2 - t1);
    histogram();
}

const index = function (x, y) {
    return (x + canvas.width * y) * 4;
}

const findClosestColor = function (val, steps) {
    return Math.round((steps * val) / 255) * Math.floor(255 / steps);
}

const convol = function (arr, n, matrix, div) {
    const li = 4 * canvas.width;
    let sum = data[n] * matrix[4]; //center
    sum += arr[n - li - 4] * matrix[0]; //top left
    sum += arr[n - li + 4] * matrix[2]; // top right
    sum += arr[n + li - 4] * matrix[6]; // bottom left
    sum += arr[n + li + 4] * matrix[8]; // bottom right
    sum += arr[n - li] * matrix[1]; // top
    sum += arr[n - 4] * matrix[3]; // left
    sum += arr[n + 4] * matrix[5]; // right
    sum += arr[n + li] * matrix[7]; // bottom
    if (div > 0) {
        sum = Math.floor(sum / div);
    }
    return sum;
}

const threshold = function (threshold) {
    if (threshold === undefined) {
        threshold = Math.round(data.reduce(function (prev, next) {
            return prev + next
        }) / data.length);
    }
    let t1 = Date.now();
    let bob = new ImageData(canvas.width, canvas.height);
    bob.data.fill(255);
    for (let j = 1; j < canvas.height; j++) {
        for (let i = 1; i < canvas.width; i++) {
            let idx = index(i, j);
            let val = (data[idx] >= threshold) ? 255 : 0;
            bob.data[idx] = val;
            bob.data[idx + 1] = val;
            bob.data[idx + 2] = val;
            // bob.data[idx] = Math.round(data[idx] / 255) * 255; // round donne 0 ou 1
        }
    }
    ctx.putImageData(bob, 0, 0);
    let t2 = Date.now()
    console.log(t2 - t1);
}


const atkinson = function () {
    let t1 = Date.now();
    let result = new ImageData(canvas.width, canvas.height);
    let error = new ImageData(canvas.width, canvas.height);
    error.data.set(data); // copy the original array to store error diffusion
    result.data.fill(255);
    for (let j = 1; j < canvas.height; j++) {
        for (let i = 1; i < canvas.width; i++) {
            let idx = index(i, j);
            for (let n = 0; n < 3; n++) {
                let oldVal = error.data[idx + n];
                let newVal = Math.round(oldVal / 255) * 255; // round donne 0 ou 1 (x 255)
                result.data[idx + n] = newVal;
                // error diffusion
                let err = Math.round((oldVal - newVal) / 8);
                error.data[index(i + 1, j) + n] += err;
                if (i + 2 < canvas.width) {
                    error.data[index(i + 2, j) + n] += err;
                }
                error.data[index(i - 1, j + 1) + n] += err;
                error.data[index(i, j + 1) + n] += err;
                error.data[index(i + 1, j + 1) + n] += err;
                if (j + 2 < canvas.height) {
                    error.data[index(i, j + 2) + n] += err;
                }
            }
        }
    }
    ctx.putImageData(result, 0, 0);
    data = result.data;
    let t2 = Date.now()
    console.log(t2 - t1);
    histogram();
    // console.log(result.data);
}

const median = function () {
    let t1 = Date.now();
    let result = new ImageData(canvas.width, canvas.height);
    result.data.set(data); // copy the original array to store error diffusion
    for (let j = 1; j < canvas.height - 1; j++) {
        for (let i = 1; i < canvas.width - 1; i++) {
            let idx = index(i, j);
            let arr = new Array(9); // stores the pixels values
            arr[0] = data[index(i - 1, j - 1)];
            arr[1] = data[index(i, j - 1)];
            arr[2] = data[index(i + 1, j - 1)];
            arr[3] = data[index(i - 1, j)];
            arr[4] = data[idx];
            arr[5] = data[index(i + 1, j)];
            arr[6] = data[index(i - 1, j + 1)];
            arr[7] = data[index(i, j + 1)];
            arr[8] = data[index(i + 1, j + 1)];
            arr.sort();
            result.data[idx] = arr[4];
            result.data[idx + 1] = arr[4];
            result.data[idx + 2] = arr[4];
        }
    }
    ctx.putImageData(result, 0, 0);
    data = result.data;
    let t2 = Date.now()
    console.log(t2 - t1);
    // console.log(result.data);
}

const histogram = function () {
    let valsR = new Array(256);
    let valsG = new Array(256);
    let valsB = new Array(256);
    valsR.fill(0);
    valsG.fill(0);
    valsB.fill(0);
    for (let i = 0; i < data.length; i += 4) {
        valsR[data[i]]++;
        valsG[data[i + 1]]++;
        valsB[data[i + 2]]++;
    }
    let maxR = Math.max(...valsR);
    let maxG = Math.max(...valsG);
    let maxB = Math.max(...valsB);
    let maxi = Math.max(maxR, maxG, maxB)
    let factor = 128 / maxi;

    ctxHisto.clearRect(0, 0, histo.width, histo.height);
    // draw rect & gradient
    ctxHisto.strokeStyle = '#000';
    ctxHisto.strokeRect(0, 0, 130, 130);
    // ctxHisto.fill();
    const grad = ctxHisto.createLinearGradient(0, 0, 128, 0);
    grad.addColorStop(0, '#000');
    grad.addColorStop(1, '#fff');
    ctxHisto.fillStyle = grad;
    ctxHisto.fillRect(1, 130, 128, 12)
    ctxHisto.strokeStyle = '#000';
    ctxHisto.strokeRect(0, 130, 130, 12);

    if (maxR == maxG && maxR == maxB) {
        ctxHisto.strokeStyle = '#000';
        valsR.forEach((v, idx) => {
            ctxHisto.beginPath();
            ctxHisto.moveTo((idx) / 2 + 1, 130);
            ctxHisto.lineTo((idx) / 2 + 1, 130 - (v * factor));
            ctxHisto.stroke();
        });
    } else {
        ctxHisto.strokeStyle = 'hsla(0, 100%, 50%, .33)';
        valsR.forEach((v, idx) => {
            ctxHisto.beginPath();
            ctxHisto.moveTo((idx + 1) / 2, 130);
            ctxHisto.lineTo((idx + 1) / 2, 130 - (v * factor));
            ctxHisto.stroke();
        });
        ctxHisto.strokeStyle = 'hsla(120, 100%, 50%, .33)';
        valsG.forEach((v, idx) => {
            ctxHisto.beginPath();
            ctxHisto.moveTo((idx + 1) / 2, 130);
            ctxHisto.lineTo((idx + 1) / 2, 130 - (v * factor));
            ctxHisto.stroke();
        });
        ctxHisto.strokeStyle = 'hsla(240, 100%, 50%, .33)';
        valsB.forEach((v, idx) => {
            ctxHisto.beginPath();
            ctxHisto.moveTo((idx + 1) / 2, 130);
            ctxHisto.lineTo((idx + 1) / 2, 130 - (v * factor));
            ctxHisto.stroke();
        });
    }
}

const colorize = function (v) {
    let bob = new ImageData(canvas.width, canvas.height);
    for (let i = 0; i < bob.data.length; i += 4) {
        if (data[i] === v) {
            bob.data[i] = 255; // rouge
            bob.data[i + 1] = 0; // vert
            bob.data[i + 2] = 255; // bleu
        } else {
            bob.data[i] = data[i]; // rouge
            bob.data[i + 1] = data[i + 1]; // vert
            bob.data[i + 2] = data[i + 2]; // bleu
        }
        bob.data[i + 3] = 255; // alpha
    }
    ctx.putImageData(bob, 0, 0);
}

const download = function () {
    const link = document.createElement('a');
    link.download = 'download.png';
    link.href = canvas.toDataURL();
    link.click();
    link.delete;
}

const loadImage = function () {
    ctx.drawImage(img, 0, 0);
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    data = imageData.data;
    img.onload = histogram();
}

window.addEventListener("load", e => {
    loadImage();

    filters.forEach((f, idx) => {
        const o = document.createElement('option')
        o.value = f.name;
        o.innerText = f.name;
        if (idx === 0) o.selected = true;
        filtersMenu.append(o)
    });

    filtersMenu.addEventListener('change', e => {
        let selected = e.target.value;
        if (selected !== 'none') {
            loadFilter(selected);
        }
    }, false);

    loadFilter(filters[0].name);

    btnFlip.addEventListener('click', flip);
    btnGray.addEventListener('click', gray);
    btnFilter.addEventListener('click', filter);
    btnFloyd.addEventListener('click', floyd);
    btnAtkinson.addEventListener('click', atkinson);
    btnDownload.addEventListener('click', download);
    btnReload.addEventListener('click', loadImage);


    document.querySelector('#matrixInputs').addEventListener("focusout", function (ev) {
        ev.preventDefault();
        let arr = getMatrix();
        // check if the matrix's inputs correspond to a registered filter
        let idx = filters.findIndex(f => f.matrix.every((val, idx) => val === arr[idx]));
        if (idx !== -1) {
            // filter is registered
            filtersMenu.selectedIndex = idx + 1; // filtersMenu[0] -> 'none'
        } else {
            // filter unknown
            filtersMenu.selectedIndex = 0;
        }
    });
});