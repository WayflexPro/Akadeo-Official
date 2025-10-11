import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useClasses } from "./ClassesContext";

export function ClassesDashboardPage() {
  const navigate = useNavigate();
  const { classes, themes } = useClasses();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Classes</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Orchestrate every learning experience from a unified workspace. Create classes, invite co-teachers, and share
            codes with students—real-time data, automation, and AI support arrive next.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate("/dashboard/classes/create")} size="lg">
            Create class
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard/classes/join")} size="lg">
            Join with code
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
        <motion.button
          type="button"
          onClick={() => navigate("/dashboard/classes/create")}
          className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center text-slate-600 shadow-sm transition hover:border-akadeo-primary hover:text-akadeo-primary"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <span className="text-4xl">＋</span>
          <span className="mt-2 text-base font-medium">Create or join a class</span>
          <span className="mt-1 text-sm text-slate-500">
            Generate a new class space or hop into a colleague’s classroom with a code.
          </span>
        </motion.button>

        {classes.map((classroom) => {
          const theme = themes.find((item) => item.id === classroom.themeId);
          return (
            <motion.div key={classroom.id} layout>
              <Card className="flex h-full flex-col overflow-hidden">
                {classroom.imageUrl ? (
                  <div className="relative h-36 w-full overflow-hidden">
                    <img
                      src={`${classroom.imageUrl}?auto=format&fit=crop&w=640&q=60`}
                      alt="Class cover"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-4 flex items-center gap-2 text-sm font-medium text-white">
                      <Badge variant="default" className="bg-black/40 text-white">
                        Code: {classroom.code}
                      </Badge>
                      {classroom.subject && <Badge variant="outline" className="border-white/30 text-white">{classroom.subject}</Badge>}
                    </div>
                  </div>
                ) : (
                  <div
                    className="h-36 w-full"
                    style={{
                      background: theme?.background ?? "linear-gradient(135deg,#1f2937,#111827)",
                    }}
                  />
                )}
                <CardHeader className="flex-1 space-y-2">
                  <CardTitle className="text-xl text-slate-900">{classroom.name}</CardTitle>
                  {classroom.description && (
                    <CardDescription className="text-sm text-slate-600">{classroom.description}</CardDescription>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2 text-xs text-slate-500">
                    {classroom.roomNumber && <span>Room {classroom.roomNumber}</span>}
                    <span>{classroom.teachers.length} teacher{classroom.teachers.length === 1 ? "" : "s"}</span>
                    <span>{classroom.students.length} student{classroom.students.length === 1 ? "" : "s"}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80">
                  <div className="flex items-center gap-2">
                    {theme && (
                      <span
                        aria-hidden
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: theme.accent }}
                      />
                    )}
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {theme?.name ?? "Default"}
                    </span>
                  </div>
                  <Button size="sm" onClick={() => navigate(`/dashboard/classes/${classroom.id}`)}>
                    Open class
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
