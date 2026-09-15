# 📦 Garments & Commercial Export Invoicing System

গার্মেন্টস ও কমার্শিয়াল এক্সপোর্ট ইনভয়েসিং, প্যাকিং লিস্ট জেনারেশন, রিয়েল-টাইম হিসাব, অ্যানালিটিক্স এবং থার্ড-পার্টি পোর্টাল অটো-ফিলের জন্য একটি আধুনিক ফুল-স্ট্যাক ওয়েব অ্যাপ্লিকেশন।

---

## 🌟 প্রধান বৈশিষ্ট্যসমূহ (Key Features)

1. **ডাটাবেজ আর্কিটেকচার (Supabase / PostgreSQL):**
   - **Clients Table:** বায়ার/অ্যাপ্লিক্যান্ট নাম, অফিস ঠিকানা, কান্ট্রি, নোটিফাই পার্টি, ইস্যুয়িং ব্যাংক (Bank Name, Branch, SWIFT, Account No)।
   - **Invoices Table:** ইনভয়েস নম্বর (যেমন: `MIL/MS/1205/2026`), তারিখ, EXP নম্বর ও তারিখ, S/C বা Master LC নম্বর ও তারিখ, এক্সপোর্টার ব্যাংক ডিটেইলস, মোট কার্টুন, মোট পিস, মোট মূল্য (Currency সহ)।
   - **Invoice Items Table:** প্রতিটি ইনভয়েসের আন্ডারে PO Number, Style, HS Code, Total Carton, Total Pcs, Gross Weight, Net Weight, CBM, Unit Price এবং Line Total Cost।
   - RLS (Row Level Security), ক্যাসকেডিং ডিলিট এবং পারফরম্যান্স ইনডেক্স সহ তৈরি।

2. **ডায়নামিক ওয়েব এন্ট্রি ফর্ম (Web Entry Form):**
   - ক্লাইন্ট সিলেক্ট ড্রপডাউন (বায়ার সিলেক্ট করলে তার ব্যাংক, ঠিকানা ও কান্ট্রি অটো চলে আসে)।
   - ইনভয়েস নম্বর, EXP নম্বর, সেলস কন্ট্রাক্ট, শিপিং পোর্ট ইত্যাদি তথ্য ইনপুট।
   - ডায়নামিক গ্রিড/টেবিল: **"Add New Row"** ক্লিক করে প্রয়োজনমতো একাধিক আইটেম যোগ বা রিমুভ করা যায়।
   - **রিয়েল-টাইম ক্যালকুলেশন:** প্রতিটি লাইনের Total Pcs, Carton, Weight, CBM ও Unit Price পরিবর্তন করলে তাত্ক্ষণিকভাবে লাইন টোটাল এবং নিচে গ্র্যান্ড টোটাল বার আপডেট হয়।

3. **ডকুমেন্ট ও ইনভয়েস জেনারেশন (Dual Format):**
   - ডেটা সেভ হওয়ার সাথে সাথে একটি ইউনিক ইনভয়েস আইডি জেনারেট হয়।
   - **১. কমার্শিয়াল ইনভয়েস (Commercial Invoice):** আন্তর্জাতিক কাস্টমস ও ব্যাংকিং মানদণ্ডে তৈরি প্রিন্টেবল A4 ও PDF ভিউ (ইনভয়েস ভ্যালুর কথায় লেখা সহ - Amount in Words)।
   - **২. প্যাকিং লিস্ট (Packing List / Item Detail Sheet):** কার্টুন নম্বর রেঞ্জ (যেমন: ১ - ১০০), পিস পার কার্টুন, নেট ওয়েট, গ্রস ওয়েট এবং CBM সামারি।
   - **এক্সেল ডাউনলোড (Excel Export):** এক ক্লিকে অফলাইনে `.xlsx` ফরম্যাটে দুটি আলাদা শিট সহ এক্সেল ফাইল ডাউনলোড।

4. **অন্য ওয়েবসাইটে অটো-ফিল (Chrome Extension & API Integration):**
   - ব্যাকএন্ড নিরাপদ API এন্ডপয়েন্ট: `GET /api/invoices/:id` যা ইনভয়েসের সমস্ত হেড ও আইটেম ডেটা JSON আকারে প্রদান করে।
   - **Manifest V3 Chrome Extension:** বাংলাদেশ ব্যাংক EXP পোর্টাল, কাস্টমস ASYCUDA পোর্টাল বা বায়ার পোর্টালে ইনভয়েস আইডি দিলেই সমস্ত ফিল্ড স্বয়ংক্রিয়ভাবে পূরণ (Autofill) হয়ে যায়।

5. **অ্যানালিটিক্স ও রিপোর্ট ড্যাশবোর্ড (Analytics Dashboard):**
   - মান্থলি ও ইয়ারলি ফিল্টার।
   - রিয়েল-টাইম রিপোর্ট কার্ড: মোট পিস, মোট কার্টুন, মোট আয় (USD ও BDT কনভার্সন সহ)।
   - মান্থলি এক্সপোর্ট পারফরম্যান্স টেবিল ও বায়ার-ভিত্তিক আয়ের চার্ট/টেবিল।

---

## 📁 প্রজেক্ট স্ট্রাকচার (Project Structure)

```
garments-export-invoice/
├── database/
│   └── schema.sql              # Supabase PostgreSQL স্কিমা, টেবিল, ভিউ এবং সিড ডেটা
├── server/
│   ├── supabase.js             # Supabase ক্লায়েন্ট ইনিশিয়ালাইজেশন ও ডেমো ডাটাবেজ
│   └── index.js                # Express API সার্ভার ও রাউটিং
├── public/                     # ফ্রন্টএন্ড ওয়েব অ্যাপ্লিকেশন
│   ├── index.html              # অ্যানালিটিক্স ড্যাশবোর্ড ও ইনভয়েস লিস্ট
│   ├── invoice-entry.html      # ডায়নামিক এন্ট্রি ফর্ম (রিয়েল-টাইম ক্যালকুলেশন)
│   ├── invoice-view.html       # কমার্শিয়াল ইনভয়েস ও প্যাকিং লিস্ট প্রিন্ট/এক্সেল ভিউ
│   ├── clients.html            # বায়ার ও ক্লাইন্ট ডিরেক্টরি ম্যানেজমেন্ট
│   ├── portal-test.html        # অটোফিল টেস্ট করার জন্য ডেমো সরকারি পোর্টাল
│   ├── extension-info.html     # এক্সটেনশন সেটআপ গাইড
│   ├── css/
│   │   ├── style.css           # আধুনিক রেসপনসিভ স্টাইলশীট
│   │   └── print.css           # A4 প্রিন্ট ও PDF স্টাইলশীট
│   ├── js/
│   │   ├── config.js           # API ক্লায়েন্ট কনফিগ
│   │   ├── entry-form.js       # ফর্মের ডায়নামিক রো ও ম্যাথ লজিক
│   │   ├── invoice-view.js     # প্রিন্ট ভিউ ও Excel (XLSX) এক্সপোর্ট লজিক
│   │   ├── analytics.js        # অ্যানালিটিক্স ও ড্যাশবোর্ড লজিক
│   │   └── clients.js          # বায়ার ম্যানেজমেন্ট লজিক
│   └── vendor/
│       └── xlsx.full.min.js    # অফলাইন SheetJS এক্সেল লাইব্রেরি
├── extension/                  # Google Chrome Autofill Extension (Manifest V3)
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── content.js              # ইউনিভার্সাল পোর্টাল ফিল্ড ম্যাচার ও ইনজেক্টর
│   └── portal-test.html
├── .env.example
├── .gitignore
└── package.json
```

---

## 🚀 সেটআপ ও রান করার নিয়ম (Quick Start Guide)

### ধাপ ১: ডিপেন্ডেন্সি ইনস্টল
টার্মিনালে প্রজেক্ট ফোল্ডারে প্রবেশ করে কমান্ড চালান:
```bash
cd garments-export-invoice
npm install
```

### ধাপ ২: Supabase ডাটাবেজ সেটআপ
1. [supabase.com](https://supabase.com)-এ গিয়ে একটি নতুন প্রজেক্ট তৈরি করুন।
2. Supabase ড্যাশবোর্ডের বাম পাশের মেন্যু থেকে **SQL Editor**-এ যান।
3. প্রজেক্টের `database/schema.sql` ফাইলের সমস্ত কোড কপি করে SQL Editor-এ পেস্ট করে **Run** চাপুন। (এটি আপনার সব টেবিল, RLS পলিসি, ভিউ ও স্যাম্পল বায়ার তৈরি করে দেবে)।
4. Supabase-এর **Project Settings -> API** থেকে `Project URL` এবং `anon public key` কপি করুন।
5. প্রজেক্টের `.env` ফাইলটি ওপেন করে আপনার ক্রেডেনশিয়াল বসিয়ে দিন:
   ```env
   PORT=5000
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_KEY=your-supabase-anon-or-service-key
   ```
*(নোট: আপনি যদি সাথে সাথে Supabase যুক্ত নাও করেন, সিস্টেমটি স্বয়ংক্রিয়ভাবে লোকাল Mock ডেটাবেজে সম্পূর্ণ ফিচার সহ রান করবে!)*

### ধাপ ৩: সার্ভার চালু করা
```bash
npm start
```
অথবা ডেভেলপমেন্ট মোডে:
```bash
npm run dev
```

সার্ভার চালু হলে ব্রাউজারে প্রবেশ করুন:
- 📊 **ড্যাশবোর্ড:** `http://localhost:5000/index.html`
- 📝 **নতুন ইনভয়েস তৈরি:** `http://localhost:5000/invoice-entry.html`
- 🏢 **বায়ার ডিরেক্টরি:** `http://localhost:5000/clients.html`
- 🧪 **টেস্ট পোর্টাল:** `http://localhost:5000/portal-test.html`

---

## ⚡ Chrome Extension (Autofill) ব্যবহারের নিয়ম

1. গুগল ক্রোম ব্রাউজার খুলে অ্যাড্রেস বারে যান: `chrome://extensions`
2. ডানদিকের কোণায় **Developer mode** অন করুন।
3. বামদিকের **"Load unpacked"** বাটনে ক্লিক করুন।
4. প্রজেক্টের `garments-export-invoice/extension` ফোল্ডারটি সিলেক্ট করুন।
5. এবার ব্রাউজারে `http://localhost:5000/portal-test.html` (অথবা যেকোনো সরকারি EXP পোর্টাল) ওপেন করুন।
6. এক্সটেনশন আইকনে ক্লিক করে যেকোনো ইনভয়েস নম্বর (যেমন: `MIL/MS/1205/2026`) সিলেক্ট করে **"⚡ Autofill Active Webpage"** চাপুন।
7. মুহূর্তেই সমস্ত ইনপুট বক্স সবুজ রঙে হাইলাইট হয়ে স্বয়ংক্রিয়ভাবে পূরণ হয়ে যাবে!

---

## 🌐 নতুন GitHub রিপোজিটরিতে যুক্ত করার নিয়ম (Git Push Instructions)

এই প্রজেক্টটিকে আপনার নিজস্ব গিটহাবে যুক্ত করতে নিচের কমান্ডগুলো ধারাবাহিকভাবে টার্মিনালে চালান:

```bash
# ১. গিট ইনিশিয়ালাইজ করুন
git init

# ২. সমস্ত ফাইল স্টেজে যোগ করুন
git add .

# ৩. ইনিশিয়াল কমিট দিন
git commit -m "Initial commit: Garments Export Invoicing & Management System"

# ৪. মেইন ব্রাঞ্চ নির্বাচন করুন
git branch -M main

# ৫. আপনার GitHub-এ তৈরি করা নতুন রিপোজিটরির লিঙ্ক যোগ করুন
# (নিচের লিঙ্কের জায়গায় আপনার তৈরি রিপোজিটরির লিংক দিন)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# ৬. কোড গিটহাবে পুশ করুন
git push -u origin main
```

---

## 📊 দরকারী SQL কুয়েরি (Analytics & Reports Queries)

### ১. নির্দিষ্ট মাসের মোট পিস, কার্টুন ও আয়:
```sql
SELECT 
    TO_CHAR(invoice_date, 'YYYY-MM') AS export_month,
    COUNT(id) AS total_invoices,
    SUM(total_pcs) AS total_pcs_shipped,
    SUM(total_carton) AS total_cartons,
    SUM(total_amount) AS total_revenue_usd
FROM invoices
WHERE TO_CHAR(invoice_date, 'YYYY-MM') = '2026-09'
GROUP BY TO_CHAR(invoice_date, 'YYYY-MM');
```

### ২. বায়ার-ভিত্তিক বার্ষিক এক্সপোর্ট আয়:
```sql
SELECT 
    c.applicant_name AS buyer_name,
    c.country,
    COUNT(i.id) AS invoices_count,
    SUM(i.total_pcs) AS total_pcs,
    SUM(i.total_amount) AS total_usd
FROM clients c
JOIN invoices i ON c.id = i.client_id
WHERE EXTRACT(YEAR FROM i.invoice_date) = 2026
GROUP BY c.applicant_name, c.country
ORDER BY total_usd DESC;
```

---

**Developed with ❤️ for Ready-Made Garments (RMG) & Commercial Export Industry.**
