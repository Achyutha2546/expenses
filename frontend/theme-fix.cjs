const fs = require('fs');
const path = require('path');

const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
};

const files = walk('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace hardcoded background colors
    content = content.replace(/\bbg-slate-950\b/g, 'bg-slate-50 dark:bg-slate-950');
    content = content.replace(/\bbg-slate-900\b/g, 'bg-white dark:bg-slate-900');
    content = content.replace(/\bbg-slate-850\b/g, 'bg-slate-100 dark:bg-slate-850');
    content = content.replace(/\bbg-slate-800\b/g, 'bg-slate-200 dark:bg-slate-800');
    
    // Replace border colors
    content = content.replace(/\bborder-slate-800\b/g, 'border-slate-200 dark:border-slate-800');
    content = content.replace(/\bborder-slate-850\b/g, 'border-slate-200 dark:border-slate-850');
    content = content.replace(/\bborder-slate-700\b/g, 'border-slate-300 dark:border-slate-700');
    
    // Replace text colors
    content = content.replace(/\btext-slate-200\b/g, 'text-slate-800 dark:text-slate-200');
    content = content.replace(/\btext-slate-300\b/g, 'text-slate-700 dark:text-slate-300');
    content = content.replace(/\btext-slate-400\b/g, 'text-slate-600 dark:text-slate-400');
    
    // Replace text-white
    content = content.replace(/\btext-white\b/g, 'text-slate-900 dark:text-white');
    
    // Fix buttons (this regex finds colorful background classes and reverts the text color change if they are in the same class string)
    // Actually, a simpler way is just to revert it globally where the background color is found within the same line
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/bg-brand|bg-rose|bg-emerald|bg-blue|from-brand|from-rose|from-emerald/)) {
            lines[i] = lines[i].replace(/text-slate-900 dark:text-white/g, 'text-white');
        }
    }
    content = lines.join('\n');
    
    fs.writeFileSync(file, content, 'utf8');
});

console.log('Theme classes updated!');
