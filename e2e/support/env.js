function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

export const env = {
  webBaseUrl: required('WEB_BASE_URL', 'http://localhost:8080'),
  apiBaseUrl: required('API_BASE_URL', 'http://localhost:3000'),
  username: required('TEST_USERNAME'),
  password: required('TEST_PASSWORD'),
  centerId: required('TEST_CENTER_ID', 'CENTER-001'),
  partCode: required('TEST_PART_CODE', 'PART-BRAKE-01')
};