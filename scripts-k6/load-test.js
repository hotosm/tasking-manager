import http from 'k6/http';
import { check, sleep } from 'k6';
import { b64encode } from 'k6/encoding';

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
        http_req_failed: ['rate==0.0'],    // 0% de errores tolerados
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
    };

    // FASE 1: Obtener la grilla espacial (GET)
    const resGet = http.get(`${BASE_URL}/api/v2/projects/${projectId}/tasks/`, params);
    check(resGet, {
        'GET tasks status is 200': (r) => r.status === 200,
    });

    // Simulación de Think Time (2 a 5 segundos)
    sleep(Math.random() * (5 - 2) + 2);

    // FASE 2: Bloquear tarea aleatoria para mapeo (POST)
    // Asumimos tareas de 1 a 1000 generadas por el seed script
    const randomTaskId = Math.floor(Math.random() * 1000) + 1;
    const payload = JSON.stringify({
        lockAction: "lock" // Ajustado según API standard de TM
    });
    
    // Bug #2 arreglado: Endpoint correcto
    const resPost = http.post(`${BASE_URL}/api/v2/projects/${projectId}/tasks/actions/lock-for-mapping/${randomTaskId}/`, payload, params);
    check(resPost, {
        'POST lock status is 200': (r) => r.status === 200,
    });
}
