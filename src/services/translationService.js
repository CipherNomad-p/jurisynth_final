const API_URL = "http://65.0.240.171:8000/translate";

let activeController = null;

export async function translateCase(texts, targetLang, sourceLang = "eng_Latn") {

  if (!texts || texts.length === 0) {
    return { success: false };
  }

  const payload = {
    texts,
    source_lang: sourceLang,
    target_lang: targetLang
  };

  try {

    if (activeController) {
      activeController.abort();
    }

    const controller = new AbortController();
    activeController = controller;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Translation request failed (${response.status})`);
    }

    const data = await response.json();

    return {
      success: true,
      translations: data.translations
    };

  } catch (error) {

    if (error.name === "AbortError") {
      return { success: false, aborted: true };
    }

    console.error("Translation service error:", error);

    return { success: false };
  }
}