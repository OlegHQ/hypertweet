package ai

import (
	"encoding/json"
	"strings"
)

func parseJSONStringArray(s string) []string {
	trimmed := strings.TrimSpace(s)
	if trimmed == "" {
		return nil
	}

	// Remove common code fences
	trimmed = strings.TrimPrefix(trimmed, "```json")
	trimmed = strings.TrimPrefix(trimmed, "```")
	trimmed = strings.TrimSuffix(trimmed, "```")
	trimmed = strings.TrimSpace(trimmed)

	var out []string
	if err := json.Unmarshal([]byte(trimmed), &out); err == nil {
		return normalizeStrings(out)
	}

	// Try to extract the first JSON array substring.
	start := strings.Index(trimmed, "[")
	end := strings.LastIndex(trimmed, "]")
	if start >= 0 && end > start {
		sub := strings.TrimSpace(trimmed[start : end+1])
		if err := json.Unmarshal([]byte(sub), &out); err == nil {
			return normalizeStrings(out)
		}
	}

	return nil
}

func normalizeStrings(in []string) []string {
	out := make([]string, 0, len(in))
	for _, v := range in {
		v = strings.TrimSpace(v)
		if v == "" {
			continue
		}
		out = append(out, v)
	}
	return out
}
