export function parseMenuDescription(menuDescription: any) {
    if (!menuDescription || typeof menuDescription !== 'string') {
        return [];
    }

    return menuDescription
        .split('\n')
        .flatMap(line => line.split(','))
        .map(item =>
            item
                .trim()
                .replace(/^(\d+\.|-|\*)\s*/, '')
        )
        .filter(item => item.length > 0);
}

export type BadgeColor = "success" | "error" | "warning" | "info";

export interface BadgePropsHelper {
  color: BadgeColor;
  children: string;
}

const STATUS_MAP: Record<string, BadgePropsHelper> = {
  Approved: { color: "success", children: "Approved" },
  Rejected: { color: "error", children: "Rejected" },
  Canceled: { color: "error", children: "Canceled" },
  "In Progress": { color: "info", children: "In Progress" },
  Completed: { color: "success", children: "Completed" },
  Submit: { color: "warning", children: "Submit" },
};

export function getBadgeStatus(status: string): BadgePropsHelper {
  return (
    STATUS_MAP[status] ?? {
      color: "info",
      children: status,
    }
  );
}

