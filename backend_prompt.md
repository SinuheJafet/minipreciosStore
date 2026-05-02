# Backend Prompt

## Nuevo endpoint recomendado para dashboard de ventas

### Objetivo
Evitar discrepancias entre ventas realizadas y pendientes en el dashboard admin, unificando ventas de ecommerce (orders) y POS (sales) en una sola fuente historica.

### Endpoint
- Metodo: GET
- Ruta: /api/admin/dashboard/sales-summary
- Query params:
  - year (number, opcional): ano a consultar. Si no llega, usar ano actual del servidor.
  - timezone (string, opcional): por defecto America/Mexico_City.

### Respuesta esperada
```json
{
  "year": 2026,
  "currency": "MXN",
  "last7Days": [
    { "date": "2026-05-01", "realized": 1200, "pending": 400 },
    { "date": "2026-04-30", "realized": 800, "pending": 0 }
  ],
  "months": [
    { "month": 1, "realized": 15000, "pending": 1200 },
    { "month": 2, "realized": 13200, "pending": 900 }
  ],
  "totals": {
    "realized": 28200,
    "pending": 2100,
    "ordersRealized": 120,
    "ordersPending": 18
  }
}
```

### Reglas de negocio
- Realized incluye estados: paid, processing, shipped, delivered, completed, confirmed.
- Pending incluye estados: pending, pending_transfer, awaiting_payment, payment_pending.
- Excluir cancelled de ambas series.
- Normalizar fecha en timezone solicitado para agregaciones por dia/mes.
- Incluir ventas POS y ecommerce en la misma agregacion.

### Notas de implementacion
- Si existen tablas separadas para orders y sales, unificar con UNION ALL y luego agrupar.
- Index recomendado: createdAt + status.
- Agregar cache corto (30 a 60 segundos) para evitar carga innecesaria en dashboard.
