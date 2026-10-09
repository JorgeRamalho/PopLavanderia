import { DRYER_PROGRAMS, EXTRA_DRY_CREDITS, EXTRA_DRY_MINUTES, WASHER_PROGRAMS } from "../data/pricing.js";
import { STORES } from "../data/stores.js";
import { spend } from "./credits.js";
import { uid } from "./format.js";
import { read, write } from "./storage.js";

const MACHINES_KEY = "pop.machines";
const CYCLES_KEY = "pop.cycles";

function programOf(machine) {
  return machine.type === "washer" ? WASHER_PROGRAMS[machine.program] : DRYER_PROGRAMS[machine.program];
}

export function listMachines() {
  return read(MACHINES_KEY, []);
}

function saveMachines(machines) {
  write(MACHINES_KEY, machines);
}

export function listCycles() {
  return read(CYCLES_KEY, []);
}

function saveCycles(cycles) {
  write(CYCLES_KEY, cycles.slice(0, 300));
}

export function reconcileMachines(now = Date.now()) {
  const machines = listMachines().map((machine) => {
    if (machine.status === "busy" && machine.endsAt <= now) {
      return {
        ...machine,
        status: "free",
        userId: null,
        cycleId: null,
        startedAt: null,
        endsAt: null,
      };
    }
    return machine;
  });
  saveMachines(machines);

  const cycles = listCycles().map((cycle) => {
    if (cycle.status === "running" && cycle.endsAt <= now) {
      return { ...cycle, status: "done" };
    }
    return cycle;
  });
  saveCycles(cycles);
  return machines;
}

export function machinesByStore(storeId) {
  return reconcileMachines().filter((machine) => machine.storeId === storeId);
}

export function getMachine(machineId) {
  return reconcileMachines().find((machine) => machine.id === machineId) ?? null;
}

export function currentPhase(machine, now = Date.now()) {
  if (machine.status !== "busy") return "Livre";
  const program = programOf(machine);
  const total = machine.endsAt - machine.startedAt;
  const elapsed = Math.min(total, Math.max(0, now - machine.startedAt));
  const ratio = total ? elapsed / total : 0;
  let name = program.phases[0]?.name ?? "Em ciclo";
  for (const phase of program.phases) {
    if (ratio >= phase.at) name = phase.name;
  }
  return name;
}

export function startCycle({ userId, machineId, extraDry = false }) {
  const machines = reconcileMachines();
  const machine = machines.find((item) => item.id === machineId);
  if (!machine) throw new Error("Máquina não encontrada.");
  if (machine.status !== "free") throw new Error("Esta máquina já está em uso.");
  if (machine.maintenance) throw new Error("Esta máquina está em manutenção.");

  const program = programOf(machine);
  const extra = machine.type === "dryer" && extraDry;
  const minutes = program.minutes + (extra ? EXTRA_DRY_MINUTES : 0);
  const credits = program.credits + (extra ? EXTRA_DRY_CREDITS : 0);
  const now = Date.now();
  const cycleId = uid("cyc");

  spend(
    userId,
    credits,
    `${machine.type === "washer" ? "Lavagem" : "Secagem"} · ${machine.label}`,
    { machineId, storeId: machine.storeId, minutes },
  );

  const updated = machines.map((item) =>
    item.id === machineId
      ? {
          ...item,
          status: "busy",
          userId,
          cycleId,
          startedAt: now,
          endsAt: now + minutes * 60 * 1000,
        }
      : item,
  );
  saveMachines(updated);

  saveCycles([
    {
      id: cycleId,
      userId,
      storeId: machine.storeId,
      machineId,
      type: machine.type,
      label: machine.label,
      minutes,
      credits,
      extraDry: extra,
      startedAt: now,
      endsAt: now + minutes * 60 * 1000,
      status: "running",
    },
    ...listCycles(),
  ]);

  return getMachine(machineId);
}

export function seedMachinesIfNeeded() {
  if (listMachines().length) return listMachines();

  const machines = [];
  for (const store of STORES) {
    store.washers.forEach((program, index) => {
      const spec = WASHER_PROGRAMS[program];
      machines.push({
        id: `${store.id}-w${index + 1}`,
        storeId: store.id,
        type: "washer",
        number: index + 1,
        program,
        label: `Lavadora ${spec.label}`,
        status: "free",
        maintenance: false,
        userId: null,
        cycleId: null,
        startedAt: null,
        endsAt: null,
      });
    });
    store.dryers.forEach((program, index) => {
      const spec = DRYER_PROGRAMS[program];
      machines.push({
        id: `${store.id}-d${index + 1}`,
        storeId: store.id,
        type: "dryer",
        number: index + 1,
        program,
        label: `Secadora ${spec.label}`,
        status: "free",
        maintenance: false,
        userId: null,
        cycleId: null,
        startedAt: null,
        endsAt: null,
      });
    });
  }

  const now = Date.now();
  machines.forEach((machine, index) => {
    if (index % 7 === 0) {
      machine.status = "busy";
      machine.userId = "guest";
      machine.startedAt = now - 8 * 60 * 1000;
      machine.endsAt = now + (12 + (index % 18)) * 60 * 1000;
    }
    if (index % 19 === 0) {
      machine.maintenance = true;
      machine.status = "free";
      machine.userId = null;
      machine.startedAt = null;
      machine.endsAt = null;
    }
  });

  saveMachines(machines);
  return machines;
}

export function userActiveCycles(userId) {
  return listCycles().filter((cycle) => cycle.userId === userId && cycle.status === "running" && cycle.endsAt > Date.now());
}

export function userHistory(userId) {
  return listCycles().filter((cycle) => cycle.userId === userId);
}
