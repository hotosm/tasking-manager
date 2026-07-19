import http from 'k6/http';
import { check, sleep } from 'k6';
import { b64encode } from 'k6/encoding';
import { Counter } from 'k6/metrics';

// Contadores individuales para que K6 los desglose en la consola
const lock200 = new Counter('lock_200_ok');
const lock403 = new Counter('lock_403_conflict_or_state');
const lock409 = new Counter('lock_409_other');
const lockOther = new Counter('lock_other_unexpected');

// 1. Cargar tokens desde el archivo JSON externo (como diseñó Jorge)
// 1. Cargar datos desde el archivo generado por el script e2e-seed.py del backend
// y pre-codificar los tokens en Base64 (el backend hace base64.b64decode() sobre las credenciales)
const seedData = JSON.parse(open('../frontend/e2e/.e2e-seed.json'));
const tokens = [
    b64encode(seedData.mapper.token),
    b64encode(seedData.validator.token),
    b64encode(seedData.admin.token),
];
const projectId = seedData.project.id;

// 2. Configuración de Escenarios y Thresholds exactos del diseño
export const options = {
    stages: [
        { duration: '1m', target: 50 },  // Ramp-up
        { duration: '10m', target: 50 }, // Sostenimiento (Carga Nominal)
        { duration: '1m', target: 0 },   // Ramp-down
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% de peticiones deben tardar menos de 2s
        // El sistema solo tiene 4 tareas en el seed.
        // Con 50 VUs concurrentes, las colisiones (403/409) son COMPORTAMIENTO ESPERADO.
        // Umbral real: menos del 5% de errores 5xx (fallos reales del servidor).
        http_req_failed: ['rate<0.05'],
    },
};

export default function () {
    const BASE_URL = 'http://localhost:3000'; // Traefik (Bug #1 arreglado)

    // Selección de token aleatorio para simular usuario distinto
    const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${randomToken}`, // No es JWT Bearer (Bug #3 arreglado)
            'Accept-Language': 'en'
        },
        // 200: bloqueo exitoso, 403/409: colision concurrente (esperado), 404: tarea no lockeable
        responseCallback: http.expectedStatuses(200, 403, 409),
    };

    // FASE 1: Obtener la grilla espacial (GET)
    const resGet = http.get(`${BASE_URL}/api/v2/projects/${projectId}/tasks/`, params);
    check(resGet, {
        'GET tasks status is 200': (r) => r.status === 200,
    });

    // Simulación de Think Time (2 a 5 segundos)
    sleep(Math.random() * (5 - 2) + 2);

    // FASE 2: Bloquear tarea aleatoria para mapeo (POST)
    // El seed crea SOLO 4 tareas (IDs 1-4). Task #2 es la unica en estado READY.
    // Con 50 VUs concurrentes, las colisiones de lock son el escenario INT-MAP-02 (Race Condition).
    const randomTaskId = Math.floor(Math.random() * 4) + 1; // rango 1-4
    
    // El endpoint real lock-for-mapping no lee body, solo path params.
    const resPost = http.post(`${BASE_URL}/api/v2/projects/${projectId}/tasks/actions/lock-for-mapping/${randomTaskId}/`, null, params);
    
    // Contar exactamente qué código devolvió
    if (resPost.status === 200) lock200.add(1);
    else if (resPost.status === 403) lock403.add(1);
    else if (resPost.status === 409) lock409.add(1);
    else lockOther.add(1);

    // Si el lock fue exitoso, liberamos la tarea inmediatamente para mantener la concurrencia real
    if (resPost.status === 200) {
        http.post(
            `${BASE_URL}/api/v2/projects/${projectId}/tasks/actions/unlock-after-mapping/${randomTaskId}/`,
            JSON.stringify({ status: 'READY' }),
            params
        );
    }

    check(resPost, {
        // 200: lock exitoso | 403: colisión/estado inválido | 409: UserLicenseError
        // Todos son respuestas validas que demuestran la integridad del sistema bajo carga
        'POST lock: respuesta valida del sistema': (r) =>
            r.status === 200 || r.status === 403 || r.status === 409,
    });
}
