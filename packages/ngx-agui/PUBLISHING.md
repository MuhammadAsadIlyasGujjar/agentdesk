# npm par publish karne ka tareeqa

Package: **`@masad-ilyas-gujar/ngx-agui`**

---

## ⚠️ Pehle ye 4 baatein samajh lein

Publish karna **irreversible** samjhein. Ye koi darane wali baat nahi, bas
haqeeqat hai:

| Baat | Tafseel |
|---|---|
| **Public hai** | Duniya ka koi bhi shakhs install kar sakta hai, code parh sakta hai |
| **Unpublish mushkil hai** | Sirf **72 ghante** ke andar mumkin, aur agar kisi aur package ne aapke package par depend kar liya to npm mana kar dega |
| **Version dobara use nahi hota** | `0.1.0` publish ho gaya to wo number hamesha ke liye khatam. Galti ho to `0.1.1` publish karein |
| **Jo file package mein hai wo sab dikhegi** | `dist/` folder mein sirf 5 files jati hain — check kar lein (neeche step 4) |

### 📧 Email ke baare mein

Abhi `package.json` mein sirf **naam** hai, email nahi:

```json
"author": "M. Asad Ilyas Gujar"
```

**Ye jaan boojh kar hai.** Agar aap email likhenge:

```json
"author": "M. Asad Ilyas Gujar <aapka@email.com>"
```

...to wo **npmjs.com par sabko nazar aayegi** aur spam bots usay scrape kar
lete hain. Ye aapka faisla hai — teen raste hain:

1. **Email na likhein** (abhi yahi hai) — sabse mehfooz, bilkul normal hai
2. **Alag email** banayein sirf open-source ke liye — behtareen tareeqa
3. **Apni asli email** likhein — theek hai, bas spam ke liye tayyar rahein

> Aapke **npm account** ki email alag cheez hai — wo login ke liye hai aur
> by default public nahi hoti. Wo aap apni asli email rakh sakte hain.

---

## Step 1 — npm account banayein

1. https://www.npmjs.com/signup par jayein
2. Username **`masad-ilyas-gujar`** rakhein

   > 🔴 **Ye zaroori hai.** Package ka scope `@masad-ilyas-gujar` hai. npm sirf
   > usi scope mein publish karne deta hai jo aapka **username** ya aapki **org**
   > ho. Agar username kuch aur rakha to ya to username badalna hoga ya
   > `package.json` mein package ka naam.

3. Email verify karein (npm bina verified email ke publish nahi karne deta)
4. **2FA on karein** — Settings → Two-Factor Authentication → "Authorization and
   Publishing". Isse koi aur aapke naam par publish nahi kar sakta.

## Step 2 — terminal se login

```bash
npm login
```

Username, password, email, aur 2FA code poochega. Check karein:

```bash
npm whoami          # aapka username dikhna chahiye
```

## Step 3 — package build karein

```bash
cd packages/ngx-agui
npm install
npm run build
```

Output: `dist/masad-ilyas-gujar-ngx-agui/`

## Step 4 — publish se PEHLE dekh lein kya ja raha hai

```bash
cd ../../dist/masad-ilyas-gujar-ngx-agui
npm publish --dry-run --access public
```

Ye kuch publish nahi karta — sirf batata hai kya jayega. Aapko ye 5 files
nazar aani chahiyein:

```
README.md                                  8.2 kB
fesm2022/masad-ilyas-gujar-ngx-agui.mjs   47.5 kB
fesm2022/....mjs.map                      63.8 kB
package.json                               1.2 kB
types/masad-ilyas-gujar-ngx-agui.d.ts     16.3 kB
```

> 🔍 **Is list ko dhyan se parhein.** Agar koi `.env`, secret, ya niji file
> nazar aaye to **ruk jayein** — publish ke baad usay hatana bohat mushkil hai.

## Step 5 — publish

```bash
npm publish --access public
```

> `--access public` **lazmi** hai. Scoped packages (`@naam/...`) by default
> private samjhe jate hain, aur private publish ke liye paid plan chahiye.
> Is flag ke bagair error milega.

2FA code poochega. Ho gaya! 🎉

Package yahan hoga: `https://www.npmjs.com/package/@masad-ilyas-gujar/ngx-agui`

---

## Dosto ke saath share karna

### Option A — publish ke baad (sabse aasan)

Unhe bas ye batayein:

```bash
npm install @masad-ilyas-gujar/ngx-agui
```

Aur link bhej dein: `https://www.npmjs.com/package/@masad-ilyas-gujar/ngx-agui`
Wahan aapka poora README khud ba khud render ho jata hai — koi alag docs site
banane ki zaroorat nahi.

### Option B — publish se PEHLE (test karwane ke liye) ⭐

Ye behtareen tareeqa hai — pehle 2-3 dost try karein, feedback lein, phir
duniya ko dein:

```bash
cd packages/ngx-agui
npm run build
cd ../../dist/masad-ilyas-gujar-ngx-agui
npm pack
```

Ye ek file banati hai: `masad-ilyas-gujar-ngx-agui-0.1.0.tgz`

Wo file WhatsApp/email/Drive se bhej dein. Aapka dost:

```bash
npm install ./masad-ilyas-gujar-ngx-agui-0.1.0.tgz
```

Bilkul waise hi kaam karega jaise npm se aaya ho — magar abhi tak kuch public
nahi hua.

### Option C — GitHub

Repo public karein aur link share karein. Repo banane ke baad `package.json`
mein ye add kar dein (npm par repo ka link nazar aata hai, log zyada bharosa
karte hain):

```json
"repository": {
  "type": "git",
  "url": "git+https://github.com/MuhammadAsadIlyasGujjar/agentdesk.git"
},
"homepage": "https://github.com/MuhammadAsadIlyasGujjar/agentdesk#readme",
"bugs": { "url": "https://github.com/MuhammadAsadIlyasGujjar/agentdesk/issues" }
```

---

## Agli baar update karna ho

**Version kabhi haath se mat likhein** — `npm version` use karein, wo git tag
bhi bana deta hai:

```bash
cd packages/ngx-agui

npm version patch     # 0.1.0 -> 0.1.1   bug fix
npm version minor     # 0.1.0 -> 0.2.0   naya feature (purana code chalta rahe)
npm version major     # 0.1.0 -> 1.0.0   breaking change

npm run build
cd ../../dist/masad-ilyas-gujar-ngx-agui
npm publish --access public
```

`CHANGELOG.md` bhi update karein — log yahi parh kar decide karte hain ke
upgrade karna hai ya nahi.

---

## Masle aur unke hal

| Error | Wajah aur hal |
|---|---|
| `402 Payment Required` | `--access public` lagana bhool gaye |
| `403 Forbidden` / `Scope not found` | npm username scope se match nahi karta. `npm whoami` chalayein — output `masad-ilyas-gujar` hona chahiye |
| `403 You cannot publish over the previously published versions` | Wo version pehle se maujood hai. `npm version patch` karke naya number lein |
| `ENEEDAUTH` | `npm login` dobara karein |
| `You must verify your email` | npmjs.com par email verify karein |
| `EOTP` / 2FA maang raha hai | Authenticator app ka 6-digit code daalein |
| Publish ho gaya magar galti ho gayi | 72 ghante ke andar: `npm unpublish @masad-ilyas-gujar/ngx-agui@0.1.0`. Uske baad sirf `npm deprecate` se warning laga sakte hain |

---

## Publish se pehle aakhri checklist

- [ ] `npm whoami` → `masad-ilyas-gujar`
- [ ] `npm run build` bina error ke chala
- [ ] `npm publish --dry-run` mein sirf 5 expected files hain
- [ ] `README.md` mein `<your-username>` jaisa koi placeholder nahi bacha
- [ ] `LICENSE` file maujood hai
- [ ] `package.json` mein email tabhi hai jab aap chahte hain (default: sirf naam)
- [ ] Version `0.1.0` hai aur pehle kabhi publish nahi hua
- [ ] Demo app package ke against build ho raha hai (`cd frontend && npx ng build`)
