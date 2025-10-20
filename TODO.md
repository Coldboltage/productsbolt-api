# TODO.md — ProductsBolt Direction

## 🎯 High-Level Goals

- [ ] Define clear **Purpose**: why ProductsBolt exists (problem + value)
- [ ] Write **Requirements Document** (Purpose → Overview → Requirements → Workflow → Success Criteria)
- [ ] Stabilize current API + Worker communication via RabbitMQ
- [ ] Improve system reliability and observability before scaling

---

## 🧩 Architecture & Design

- [ ] Map data flow between `Product`, `Shop`, `ShopProduct`, `Webpage`, and `WebpageCache`
- [ ] Document current queue flow (API → RabbitMQ → Worker)
- [ ] Introduce retry logic + backoff for failed jobs
- [ ] Add structured logging with correlation IDs
- [ ] Experiment with OpenTelemetry or minimal tracing
- [ ] Plan refactor of `ProcessModule` into smaller domain modules
- [ ] Write config schema + validation using `@nestjs/config`

---

## 🧪 Testing & CI/CD

- [ ] Create initial integration tests for API endpoints
- [ ] Add test harness for Worker job lifecycle
- [ ] Configure GitHub Actions for lint + build + test
- [ ] Write seed scripts for test + dev environments
- [ ] Containerize with Docker (API + Worker + RabbitMQ stack)
- [ ] Add health checks for API and Worker

---

## 📊 Observability & Metrics

- [ ] Log all major events (job start, success, failure)
- [ ] Track job durations and error counts
- [ ] Send simple alert to Discord on worker crash or queue overflow

---

## 🧠 Next Steps for Growth

- [ ] Design small **Clean Architecture** experiment for one module
- [ ] Document project workflow for new contributors
- [ ] Plan multi-env setup (local → staging → prod)
- [ ] Research load balancing / ingress options for multi-API deployment
