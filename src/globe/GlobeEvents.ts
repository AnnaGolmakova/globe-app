import EventEmitter from "eventemitter3";

interface GlobeEventMap {
	countryHovered: { code: string };
	countrySelected: { code: string };
}

export const GlobeEvents = new EventEmitter<GlobeEventMap>();
