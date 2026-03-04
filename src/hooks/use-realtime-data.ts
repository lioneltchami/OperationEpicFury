import useSWR from "swr";
export const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useStats(initialData?: any) {
    return useSWR("/api/stats", fetcher, {
        fallbackData: initialData,
        refreshInterval: 30000, // 30 seconds
    });
}

export function useTimelineEvents(initialData?: any) {
    return useSWR("/api/events", fetcher, {
        fallbackData: initialData,
        refreshInterval: 60000, // 60 seconds
    });
}
