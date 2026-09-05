export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'SAR' | 'AED' | 'EGP';

export type CurrencyDefinition = {
  code: CurrencyCode;
  label: string;
  symbol: string;
};

// مصدر وحيد وموحّد لكل ما يخص العملات في التطبيق. أي عملة جديدة مستقبلاً تُضاف هنا فقط،
// ولا داعي لتكرارها في أي ملف آخر.
export const currencies: CurrencyDefinition[] = [
  { code: 'USD', label: 'USD ($)', symbol: '$' },
  { code: 'EUR', label: 'EUR (€)', symbol: '€' },
  { code: 'GBP', label: 'GBP (£)', symbol: '£' },
  { code: 'SAR', label: 'SAR (﷼)', symbol: 'SAR ' },
  { code: 'AED', label: 'AED (د.إ)', symbol: 'AED ' },
  { code: 'EGP', label: 'EGP (ج.م)', symbol: 'ج.م ' },
];

export const DEFAULT_CURRENCY_CODE: CurrencyCode = 'USD';

export const currencyByCode = (code: string | undefined | null): CurrencyDefinition =>
  currencies.find((c) => c.code === code) || currencies.find((c) => c.code === DEFAULT_CURRENCY_CODE)!;

// "label" هو التنسيق القديم المخزَّن في settings.currency (مثل "USD ($)")، محفوظ للتوافق
// الخلفي حتى لا نكسر أي إعدادات محفوظة مسبقًا في localStorage عند المستخدمين الحاليين.
export const currencyByLabel = (label: string | undefined | null): CurrencyDefinition =>
  currencies.find((c) => c.label === label) || currencies.find((c) => c.code === DEFAULT_CURRENCY_CODE)!;

/**
 * يحوّل أي قيمة عملة محفوظة (كود نظيف مثل "EGP"، أو تسمية قديمة مثل "EGP (ج.م)"، أو حتى
 * نص انجرف/تغيّر شكله بأي طريقة) إلى كود عملة صالح دائمًا.
 *
 * هذه هي نقطة التحويل الوحيدة التي يجب أن يمر منها settings.currency قبل استخدامه في أي
 * منطق (جلب سعر، اختيار رمز، إلخ). المطابقة بالتسمية الكاملة (label) هشّة بطبيعتها: أي
 * اختلاف بسيط - رمز يونيكود مختلف الشكل لنفس العملة، مسافة زائدة، أو تعديل يدوي لاحق على
 * نص القائمة المنسدلة في مكان واحد فقط دون الآخر - يجعل المطابقة تفشل صامتة وترتد دائمًا
 * للعملة الافتراضية (USD) بغض النظر عمّا اختاره المستخدم فعليًا. المطابقة بالكود (ISO) لا
 * تعاني من هذه الهشاشة لأنه نص ثابت وبسيط لا علاقة له بأي رمز أو تنسيق عرض.
 */
export const resolveCurrencyCode = (value: string | undefined | null): CurrencyCode => {
  const byCode = currencies.find((c) => c.code === value);
  if (byCode) return byCode.code;
  const byLabel = currencies.find((c) => c.label === value);
  if (byLabel) return byLabel.code;
  return DEFAULT_CURRENCY_CODE;
};

// خريطة رموز محفوظة بنفس الشكل القديم (مفتاحها label) لأي كود يستوردها بهذا الاسم.
export const currencySymbols: Record<string, string> = currencies.reduce((acc, c) => {
  acc[c.label] = c.symbol;
  return acc;
}, {} as Record<string, string>);

/**
 * يحوّل نص مبلغ (بما فيه نصوص منسّقة برمز عملة، مثل "ج.م 5,000.00") إلى رقم صافٍ.
 *
 * لا يعتمد على مجرد إزالة الأحرف غير الرقمية، لأن رمز الجنيه المصري "ج.م" يحتوي نقطة
 * داخله: إزالة الأحرف غير الرقمية فقط كانت تترك نقطتين في النص الناتج ("..5000.00")
 * فيفشل تحويله لرقم (NaN) ويؤول لصفر في كل مكان يُستخدم فيه - أي أن أي فاتورة أو دفعة
 * بالجنيه المصري كانت تُقرأ كصفر بمجرد تنسيقها وإعادة تحليلها. بدلاً من ذلك، هذه الدالة
 * تستخرج أول نمط رقمي صحيح فعليًا (أرقام، فواصل آلاف اختيارية، نقطة عشرية واحدة فقط)
 * بغض النظر عمّا يحيط به من رموز أو نصوص.
 */
export const parseCurrencyAmount = (value: string | number | unknown): number => {
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
  if (typeof value === 'string') {
    const match = value.match(/-?\d[\d,]*\.?\d*/);
    if (!match) return 0;
    const parsed = Number(match[0].replace(/,/g, ''));
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};