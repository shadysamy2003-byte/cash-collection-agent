// طبقة مركزية واحدة لجلب سعر صرف حي وموثوق. أي شاشة أو عملية إنشاء/تعديل فاتورة يجب أن
// تستدعي getLiveRate بدلاً من الاعتماد على أي state عام أو رقم افتراضي ثابت. هذا يضمن أن
// السعر المستخدم في الحساب هو نفسه دائمًا السعر الذي يُحفظ مع الفاتورة.

export type ExchangeRateSource = 'live' | 'cached_fallback';

export type LiveRateResult = {
  rate: number;
  fetchedAt: string;
  source: ExchangeRateSource;
};

export class ExchangeRateUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExchangeRateUnavailableError';
  }
}

const CACHE_KEY = 'orderflow_exchange_rate_cache_v1';

// السعر يُعتبر "حيًا" لمدة ساعة واحدة فقط. المصدر نفسه (open.er-api.com، الخطة المجانية من
// ExchangeRate-API) لا يحدّث أكثر من مرة كل 24 ساعة، فساعة واحدة كافية جدًا ولا تُقارب حدود
// معدل الاستخدام المسموح به. أي فاتورتين تُنشآن خلال نفس الساعة تأخذان نفس السعر تلقائيًا
// دون أي استدعاء شبكة إضافي.
const FRESH_TTL_MS = 60 * 60 * 1000;

// سقف الطوارئ: لو فشل الاستدعاء الحي فعليًا، نقبل استخدام آخر سعر مخزَّن حتى لو تجاوز الساعة،
// بحد أقصى 24 ساعة، ونُعلّم الفاتورة بوضوح بأن المصدر "cached_fallback" لتبقى قابلة للمراجعة.
// أقدم من ذلك يُعتبر غير موثوق إطلاقًا ويوقف عملية الحفظ تمامًا.
const EMERGENCY_FALLBACK_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const API_URL = 'https://open.er-api.com/v6/latest/USD';

type CachedRates = {
  rates: Record<string, number>;
  fetchedAt: string;
};

const readCache = (): CachedRates | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.rates || !parsed.fetchedAt) return null;
    return parsed as CachedRates;
  } catch {
    return null;
  }
};

const writeCache = (rates: Record<string, number>, fetchedAt: string) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, fetchedAt }));
  } catch {
    // فشل الكتابة في localStorage لا يمنع استخدام السعر الذي جلبناه للتو لهذه العملية بالذات
  }
};

const ageMs = (fetchedAt: string): number => Date.now() - new Date(fetchedAt).getTime();

const fetchLiveRatesOnce = async (): Promise<Record<string, number>> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Exchange rate API responded with status ${response.status}`);
  }
  const data = await response.json();
  if (!data || typeof data !== 'object' || !data.rates || typeof data.rates !== 'object') {
    throw new Error('Exchange rate API returned an unexpected response shape');
  }
  return data.rates as Record<string, number>;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// محاولة واحدة إضافية بفاصل بسيط قبل اعتبار الاستدعاء فاشلاً فعليًا والانتقال لخطة الطوارئ
const fetchLiveRatesWithRetry = async (): Promise<Record<string, number>> => {
  try {
    return await fetchLiveRatesOnce();
  } catch {
    await delay(800);
    return await fetchLiveRatesOnce();
  }
};

/**
 * يُرجع سعر صرف حي وموثوق لعملة معينة نسبة إلى الدولار (عملة التخزين الأساسية في النظام).
 * هذه هي الدالة الوحيدة التي يجب أن تُستدعى عند إنشاء أو تعديل فاتورة.
 *
 * ترمي ExchangeRateUnavailableError إن لم يوجد أي سعر حي حاليًا ولا سعر محفوظ حديث بما
 * يكفي لاستخدامه كبديل مؤقت. يجب على المستدعي دائمًا التقاط هذا الخطأ، وإيقاف عملية
 * الحفظ بالكامل، وتنبيه المستخدم بوضوح - ولا يجوز أبدًا استخدام أي رقم افتراضي بصمت.
 */
export const getLiveRate = async (currencyCode: string): Promise<LiveRateResult> => {
  if (currencyCode === 'USD') {
    return { rate: 1, fetchedAt: new Date().toISOString(), source: 'live' };
  }

  const cached = readCache();

  // الكاش لسه طازة (أقل من ساعة) - نستخدمه مباشرة من غير أي استدعاء شبكة جديد
  if (cached && ageMs(cached.fetchedAt) <= FRESH_TTL_MS && cached.rates[currencyCode] !== undefined) {
    return { rate: cached.rates[currencyCode], fetchedAt: cached.fetchedAt, source: 'live' };
  }

  try {
    const freshRates = await fetchLiveRatesWithRetry();
    const fetchedAt = new Date().toISOString();
    writeCache(freshRates, fetchedAt);

    if (freshRates[currencyCode] === undefined) {
      throw new ExchangeRateUnavailableError(`Currency ${currencyCode} is not supported by the exchange rate provider.`);
    }

    return { rate: freshRates[currencyCode], fetchedAt, source: 'live' };
  } catch (fetchError) {
    // فشل الاستدعاء الحي - نحاول آخر سعر مخزَّن كحل طوارئ فقط لو لم يتجاوز سقف 24 ساعة
    if (cached && ageMs(cached.fetchedAt) <= EMERGENCY_FALLBACK_MAX_AGE_MS && cached.rates[currencyCode] !== undefined) {
      return { rate: cached.rates[currencyCode], fetchedAt: cached.fetchedAt, source: 'cached_fallback' };
    }

    if (fetchError instanceof ExchangeRateUnavailableError) throw fetchError;

    throw new ExchangeRateUnavailableError(
      'Could not reach the exchange rate service, and no recent enough cached rate is available. Please try again shortly.'
    );
  }
};