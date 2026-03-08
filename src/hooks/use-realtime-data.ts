import useSWR from "swr";
export const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useStats(initialData?: unknown) {
    return useSWR("/api/stats", fetcher, {
        fallbackData: initialData,
        refreshInterval: 30000, // 30 seconds
    });
}

export function useTimelineEvents(initialData?: unknown) {
    return useSWR("/api/events", fetcher, {
        fallbackData: initialData,
        refreshInterval: 60000, // 60 seconds
    });
}
