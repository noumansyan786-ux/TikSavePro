# TikSavePro – TikTok Downloader (tiksavepro.online)

ویب سائٹ GitHub Pages پر چلے گی، اور ویڈیو لانے کا کام Cloudflare Worker کرے گا۔

## فائلیں

| فائل | کام |
|---|---|
| index.html, style.css, script.js | ویب سائٹ |
| config.js | یہاں اپنے Worker کا لنک ڈالنا ہے |
| terms.html, privacy.html, 404.html | ضروری صفحات (AdSense کے لیے بھی) |
| CNAME, robots.txt, sitemap.xml, favicon.svg | ڈومین اور SEO |
| worker/worker.js | Cloudflare Worker کا کوڈ (GitHub پر اپلوڈ نہ بھی کریں تو چلے گا) |

---

## مرحلہ 1: Cloudflare Worker بنائیں (پہلے یہ)

1. https://dash.cloudflare.com پر مفت اکاؤنٹ بنائیں۔
2. بائیں طرف **Workers & Pages** → **Create** → **Create Worker** دبائیں۔
3. نام رکھیں: `tiksavepro-api` → **Deploy**۔
4. **Edit code** دبائیں، وہاں کا سارا کوڈ مٹا دیں اور `worker/worker.js` کا پورا کوڈ پیسٹ کریں → **Deploy**۔
5. اوپر Worker کا لنک نظر آئے گا، جیسے:
   `https://tiksavepro-api.yourname.workers.dev` — اسے کاپی کر لیں۔
6. ٹیسٹ: براؤزر میں یہ لنک کھولیں، "TikSavePro API is running." لکھا آئے تو ٹھیک ہے۔

## مرحلہ 2: config.js میں لنک ڈالیں

`config.js` کھولیں اور یہ لائن بدلیں:

```js
window.TIKSAVE_API = "https://tiksavepro-api.yourname.workers.dev";
```

(آخر میں / نہیں لگانا)

## مرحلہ 3: GitHub پر اپلوڈ کریں

1. GitHub پر نیا **public** ریپو بنائیں، مثلاً `tiksavepro`۔
2. **Add file → Upload files** دبائیں اور zip کی ساری فائلیں (فولڈر کے اندر والی، فولڈر نہیں) اپلوڈ کریں → **Commit changes**۔
3. ریپو کی **Settings → Pages** میں جائیں:
   - Source: **Deploy from a branch**
   - Branch: **main** / **(root)** → **Save**
   - Custom domain: `tiksavepro.online` → **Save**

## مرحلہ 4: ڈومین کی DNS سیٹنگ

جہاں سے ڈومین خریدا ہے (Hostinger, Namecheap, GoDaddy وغیرہ) وہاں DNS میں یہ ڈالیں:

| Type | Name/Host | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | YOUR-GITHUB-USERNAME.github.io |

پرانے A ریکارڈ (اگر @ پر کوئی اور IP ہو) ڈیلیٹ کر دیں۔
DNS لگنے میں 10 منٹ سے 24 گھنٹے لگ سکتے ہیں۔ پھر GitHub Pages میں **Enforce HTTPS** پر ٹک لگا دیں۔

## مرحلہ 5: ٹیسٹ

https://tiksavepro.online کھولیں، کوئی TikTok لنک پیسٹ کریں اور Download دبائیں۔

---

## اگر کام نہ کرے

- **"Site setup not finished"** → config.js میں Worker کا لنک نہیں ڈالا۔
- **CORS ایرر / کچھ نہیں ہوتا** → `worker.js` میں `ALLOWED_ORIGINS` میں آپ کا ڈومین بالکل صحیح لکھا ہونا چاہیے (https کے ساتھ)۔
- **"Video not found"** → ویڈیو پرائیویٹ ہے یا لنک غلط ہے۔
- **"Server busy"** → tikwm.com API عارضی طور پر بند ہے یا لمٹ لگی ہے، تھوڑی دیر بعد کوشش کریں۔

## اہم نوٹ

- ویڈیو کی معلومات مفت **tikwm.com** API سے آتی ہیں۔ یہ تیسری پارٹی سروس ہے، اس کی لمٹس ہیں اور یہ کبھی بند بھی ہو سکتی ہے۔ زیادہ ٹریفک ہو تو کوئی paid API (مثلاً RapidAPI پر TikTok downloader) لے کر `worker.js` میں `handleApi` بدل سکتے ہیں۔
- Cloudflare Workers کا مفت پلان روزانہ 100,000 ریکویسٹس تک ہے۔
- Google AdSense ایسی ڈاؤن لوڈر سائٹس کو اکثر منظور نہیں کرتا، اس لیے Adsterra / Monetag جیسے ایڈ نیٹ ورکس بھی دیکھ لیں۔
- terms.html اور privacy.html میں ای میل `contact@tiksavepro.online` اپنی ای میل سے بدل دیں۔
