const PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "dapunjab-replat";
const API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  mapValue?: { fields: Record<string, FirestoreValue> };
  arrayValue?: { values?: FirestoreValue[] };
}

function toFirestoreValue(val: any): FirestoreValue {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "number") {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === "boolean") return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === "object") {
    const fields: Record<string, FirestoreValue> = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function fromFirestoreValue(val: FirestoreValue): any {
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) return parseInt(val.integerValue!, 10);
  if ("doubleValue" in val) return val.doubleValue;
  if ("booleanValue" in val) return val.booleanValue;
  if ("nullValue" in val) return null;
  if ("arrayValue" in val) {
    return (val.arrayValue?.values || []).map(fromFirestoreValue);
  }
  if ("mapValue" in val && val.mapValue?.fields) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields)) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

function toFirestoreFields(data: Record<string, any>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [k, v] of Object.entries(data)) {
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

function fromFirestoreDoc(doc: any): Record<string, any> {
  const result: Record<string, any> = {};
  if (doc.fields) {
    for (const [k, v] of Object.entries(doc.fields)) {
      result[k] = fromFirestoreValue(v as FirestoreValue);
    }
  }
  const nameParts = (doc.name || "").split("/");
  result.docId = nameParts[nameParts.length - 1];
  return result;
}

async function firestoreFetch(url: string, options: RequestInit = {}) {
  const fullUrl = url.includes("?") ? `${url}&key=${API_KEY}` : `${url}?key=${API_KEY}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Firestore API error (${res.status}): ${errorText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export async function addDocument(collectionName: string, data: any) {
  const result = await firestoreFetch(`${BASE_URL}/${collectionName}`, {
    method: "POST",
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  const nameParts = (result.name || "").split("/");
  return { id: nameParts[nameParts.length - 1] };
}

export async function getDocuments(collectionName: string) {
  try {
    const result = await firestoreFetch(`${BASE_URL}/${collectionName}`);
    if (!result.documents) return [];
    return result.documents.map(fromFirestoreDoc);
  } catch (e: any) {
    if (e.message.includes("404")) return [];
    throw e;
  }
}

export async function deleteDocument(collectionName: string, docId: string) {
  await firestoreFetch(`${BASE_URL}/${collectionName}/${docId}`, {
    method: "DELETE",
  });
}

export async function setDocument(collectionName: string, docId: string, data: any) {
  await firestoreFetch(`${BASE_URL}/${collectionName}/${docId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
}

export async function getDocument(collectionName: string, docId: string) {
  try {
    const result = await firestoreFetch(`${BASE_URL}/${collectionName}/${docId}`);
    if (!result.fields) return null;
    return fromFirestoreDoc(result);
  } catch (e: any) {
    if (e.message.includes("404")) return null;
    throw e;
  }
}
