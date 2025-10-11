# Classes Feature Next Steps

The UI scaffolding for class creation, management, and membership is now available in the dashboard. The following items remain for a future iteration:

- Wire the create, join, and invite flows to real API routes (`POST /api/classes`, `POST /api/classes/join`, `POST /api/classes/invite-teacher`).
- Persist themes, membership lists, and class metadata to PostgreSQL tables described in the product spec.
- Implement notifications storage and delivery so invite toasts sync with the notifications tab.
- Add role-based access control for student accounts once the authentication layer exposes roles.
- Integrate AI-powered tools (quiz generator, planner, etc.) inside the class detail tabs.
- Build student-oriented dashboard views scoped to their enrolled classes.
