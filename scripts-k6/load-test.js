import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// 1. Cargar tokens desde el archivo JSON externo (como diseñó Jorge)
const tokens = new SharedArray('users', function () {
    return JSON.parse(open('./tokens.json')).tokens;
});

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
    const BASE_URL = 'http://localhost:5000'; // Ruteado interno definido en topología

    // Selección de token aleatorio para simular usuario distinto
    const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${randomToken}`,
            'Accept-Language': 'en'
        },
    };

    // FASE 1: Obtener la grilla espacial (GET)
    const resGet = http.get(`${BASE_URL}/api/v2/projects/1/tasks/`, params);
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
    
    const resPost = http.post(`${BASE_URL}/api/v2/tasks/${randomTaskId}/lock/`, payload, params);
    check(resPost, {
        'POST lock status is 200': (r) => r.status === 200,
    });
}
