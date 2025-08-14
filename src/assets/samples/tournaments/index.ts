export interface TournamentTemplate {
    name: string;
    baseHref: string;
    logo: string;
    template: string;
}

export const logoHref = (tournament: TournamentTemplate) => tournament.baseHref + tournament.logo;
export const templateHref = (tournament: TournamentTemplate) =>
    tournament.baseHref + tournament.template;

export default [
    {
        name: "Women's Euro 2025",
        baseHref: "/assets/samples/tournaments/womens-euro-25",
        logo: "/logo.svg",
        template: "/template.json",
    },
    {
        name: "Men's Champions League 2024/25",
        baseHref: "/assets/samples/tournaments/champions-league-24-25",
        logo: "/logo.svg",
        template: "/template.json",
    },
    {
        name: "OneHSLU Fest Beerpong Tournament 2025",
        baseHref: "/assets/samples/tournaments/onehslu-fest-beerpong-25",
        logo: "/logo.svg",
        template: "/template.json",
    },
] as TournamentTemplate[];
