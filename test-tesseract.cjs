const Tesseract = require('tesseract.js');
const fs = require('fs');

async function run() {
  console.log('Iniciando Tesseract...');
  try {
    const { data: { text } } = await Tesseract.recognize(
      'C:\\Users\\carlos.lesse\\.gemini\\antigravity\\brain\\4a8e3ad0-d8de-4de8-a840-367f98e504f6\\.user_uploaded\\media_1785923190953.jpg',
      'por' // portuguese language
    );
    console.log('--- RESULTADO TESSERACT ---');
    console.log(text);
    console.log('---------------------------');
  } catch (err) {
    console.error('Erro:', err);
  }
}

run();
