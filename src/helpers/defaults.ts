import type { Tournament } from "@/types/tournament";
import { capitalise } from "./common";
import { generateId } from "./id";

interface Default {
    name: string;
    description: string;
    icon: string;
    matchDuration: number;
    breakDuration: number;
    courtLabel: {
        singular: string;
        plural: string;
    };
    sets: {
        supported: boolean;
        default: boolean;
    };
}

export const getCourtType = (sport: string, plural: boolean, capitalised: boolean): string => {
    const sportDefaults = DEFAULTS[sport] || DEFAULTS.other!;

    const courtLabel = plural
        ? sportDefaults.courtLabel.plural || sportDefaults.courtLabel.singular + "s"
        : sportDefaults.courtLabel.singular;
    return capitalised ? capitalise(courtLabel) : courtLabel;
};

export const DEFAULTS: Record<string, Default> = {
    beerpong: {
        name: "Beer Pong",
        description:
            "A drinking game in which players throw a ping pong ball across a table with the intent of landing the ball in one of several cups of beer.",
        icon: "beer-outline",
        matchDuration: 10,
        breakDuration: 5,
        courtLabel: {
            singular: "table",
            plural: "tables",
        },
        sets: {
            supported: false,
            default: false,
        },
    },
    foosball: {
        name: "Foosball",
        description:
            "A table game that is loosely based on soccer, where players control rods with figures attached to them to kick a ball into the opponent's goal.",
        icon: "football-outline",
        matchDuration: 15,
        breakDuration: 5,
        courtLabel: {
            singular: "table",
            plural: "tables",
        },
        sets: {
            supported: true,
            default: true,
        },
    },
    other: {
        name: "Other",
        description:
            "A game that does not fit into the predefined categories. You can specify your own rules and settings.",
        icon: "help-outline",
        matchDuration: 15,
        breakDuration: 5,
        courtLabel: {
            singular: "court",
            plural: "courts",
        },
        sets: {
            supported: true,
            default: false,
        },
    },
};

const todayAt1800 = new Date();
todayAt1800.setHours(18, 0, 0, 0);
export const emptyTournament = () =>
    ({
        version: 3,
        id: generateId(),
        name: "",
        teams: [],
        phases: [
            {
                id: generateId(),
                type: "group",
                name: "Group Phase",
                matches: [],
                groups: [],
                rounds: 3,
            },
            {
                id: generateId(),
                type: "knockout",
                name: "Knockout Phase",
                rounds: [],
                teamCount: 8,
            },
        ],
        config: {
            breakDuration: 5,
            knockoutBreakDuration: 5,
            courts: 4,
            startTime: todayAt1800,
            matchDuration: 10,
            sport: "other",
        },
    }) as Tournament;
