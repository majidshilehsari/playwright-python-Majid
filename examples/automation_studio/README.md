# استودیو ساخت اتوماسیون برای Playwright

این مثال یک پنل راست‌چین را داخل همان تبِ تحت‌کنترل Playwright باز می‌کند؛ مرورگر یا تب دوم نمی‌سازد و به کدهای اصلی Playwright هم وابستگی اجباری ندارد. عملیات از طریق locatorهای واقعی Playwright اجرا می‌شوند، نه با شبیه‌سازی سادهٔ رویدادهای DOM.

## راه‌اندازی

این افزونه به‌صورت کد اضافی روی Playwright نصب‌شده اضافه می‌شود. در Colab از `pip install -e .` در `/content` استفاده نکنید؛ آن مسیر به‌طور پیش‌فرض فایل `pyproject.toml` ندارد و نصب editable هم می‌تواند درایور Playwright را جایگزین کند.

اگر Playwright و Chromium را هنوز نصب نکرده‌اید:

```python
!pip install -q playwright
!python -m playwright install chromium
```

سپس شاخهٔ حاوی استودیو را دریافت کنید و دو فایل افزونه را کنار نسخهٔ نصب‌شدهٔ Playwright کپی کنید:

```python
!git clone --depth 1 --branch arena/ab2948d7-playwright-python-majid https://github.com/majidshilehsari/playwright-python-Majid.git /content/playwright-python-Majid

from pathlib import Path
import shutil
import playwright

source = Path("/content/playwright-python-Majid/playwright")
installed = Path(playwright.__file__).parent
shutil.copy2(source / "automation_studio.py", installed / "automation_studio.py")
shutil.copy2(
    source / "_impl" / "_automation_studio.js",
    installed / "_impl" / "_automation_studio.js",
)
```

بعد از آن، همان `page`ای را که با Playwright ساخته‌اید به استودیو بدهید.

### با Async API (پیشنهادی برای Colab)

```python
from playwright.automation_studio import AutomationStudio

# ابتدا سایت را در همان page باز کنید:
await page.goto("https://example.com")

# سپس پنل را به همان تب اضافه کنید:
studio = AutomationStudio(page)
await studio.start()

# start() را می‌توان روی صفحهٔ بازشده اجرا کرد؛ در ناوبری‌های بعدی هم پنل برمی‌گردد.
```

### با Sync API

```python
from playwright.automation_studio import AutomationStudio

# ابتدا سایت را در همان page باز کنید:
page.goto("https://example.com")

# سپس پنل را به همان تب اضافه کنید:
studio = AutomationStudio(page).start()

# در ناوبری‌های بعدی هم پنل دوباره ظاهر می‌شود.
```

برای بستن پنل و برداشتن bridge:

```python
await studio.close()  # Async API
# یا:
studio.close()        # Sync API
```

اگر صفحه با `page.goto()` به آدرس دیگری برود، پنل در همان تب دوباره ظاهر می‌شود. اگر `start()` را روی تب خالی `about:blank` اجرا کنید، پنل منتظر اولین `goto()` می‌ماند تا روی صفحهٔ واقعی نصب شود. وضعیت گردش‌کار تا وقتی شیء `studio` زنده است در پایتون نگه داشته می‌شود؛ برای نگهداری بلندمدت از «خروجی JSON» استفاده کنید.

## ابزارهای نسخهٔ اول

- انتخاب دیداری عنصر و ساخت locator پیشنهادی بر پایهٔ نقش، برچسب، placeholder، متن، Test ID، عنوان یا CSS selector
- کلیک، دابل‌کلیک، hover و اسکرول تا عنصر
- پرکردن سریع فیلد، تایپ مرحله‌ای، پاک‌کردن فیلد و فشردن کلید
- انتخاب گزینه، فعال/غیرفعال‌کردن checkbox و انتظار برای ظاهر/مخفی‌شدن عنصر
- مکث، رفتن به نشانی و گرفتن اسکرین‌شات
- مرتب‌کردن یا حذف مراحل، اجرا و توقف گردش‌کار
- ورود/خروج JSON و خروجی کد Python غیرهمزمان

برای اجرا، مراحل را دستی بسازید و سپس «اجرای گردش‌کار» را بزنید. هنگام انتخاب عنصر، کلیک روی خود صفحه برای ثبت انتخاب مصرف می‌شود و عمل سایت اجرا نمی‌شود. توقف، پس از تمام‌شدن مرحلهٔ جاری انجام می‌شود.

## نکات مهم

- پنل فقط روی صفحه‌ای کار می‌کند که در اختیار همان Playwright `Page` باشد؛ اگر سایت را به‌صورت تصویر ثابت یا در مرورگری مستقل باز کرده‌اید، باید همان تب را از طریق Playwright کنترل کنید.
- گردش‌کار می‌تواند لینک‌ها یا دکمه‌های واقعی را فعال کند. پیش از اجرای فرم‌های حساس، ثبت سفارش یا حذف اطلاعات، مراحل را بازبینی کنید.
- نسخهٔ فعلی رمز عبور یا فیلدهای صفحه را به‌صورت خودکار ضبط نمی‌کند؛ متن ورودی را خودتان فقط در صورت نیاز وارد کنید.
- خروجی Python از Async API استفاده می‌کند و تابع `run_automation(page)` را تولید می‌کند؛ آن را در کد خودتان با `await run_automation(page)` اجرا کنید.
