/**
 * Converts a number into French words, specifically designed for Moroccan Dirhams and Centimes.
 */
export function numberToWordsFR(amount: number): string {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    let res = '';
    
    // Hundreds
    const h = Math.floor(n / 100);
    if (h > 0) {
      if (h === 1) {
        res += 'cent ';
      } else {
        res += units[h] + ' cent' + (n % 100 === 0 ? 's' : '') + ' ';
      }
    }
    
    // Tens and units
    const rem = n % 100;
    if (rem > 0) {
      if (rem < 10) {
        res += units[rem];
      } else if (rem >= 10 && rem < 20) {
        res += teens[rem - 10];
      } else {
        const t = Math.floor(rem / 10);
        const u = rem % 10;
        
        if (t === 7) { // 70-79
          res += 'soixante ' + (u === 1 ? 'et ' : '') + teens[u];
        } else if (t === 9) { // 90-99
          res += 'quatre-vingt ' + teens[u];
        } else {
          res += tens[t] + (u === 1 ? ' et un' : u > 1 ? '-' + units[u] : '');
        }
      }
    }
    return res.trim();
  }

  if (amount === 0) return 'Zéro Dirham';

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  let words = '';

  const millions = Math.floor(integerPart / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const remaining = integerPart % 1000;

  if (millions > 0) {
    words += convertLessThanThousand(millions) + ' million' + (millions > 1 ? 's' : '') + ' ';
  }

  if (thousands > 0) {
    if (thousands === 1) {
      words += 'mille ';
    } else {
      words += convertLessThanThousand(thousands) + ' mille ';
    }
  }

  if (remaining > 0) {
    words += convertLessThanThousand(remaining) + ' ';
  }

  words = words.trim() + ' Dirhams';

  if (decimalPart > 0) {
    words += ' et ' + convertLessThanThousand(decimalPart) + ' Centimes';
  }

  // Capitalize first letter
  return words.charAt(0).toUpperCase() + words.slice(1);
}
