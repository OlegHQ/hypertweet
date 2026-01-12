package shared

import "slices"

func SliceContains(slice []string, item string) bool {
	return slices.Contains(slice, item)
}

func SliceRemove(slice []string, item string) []string {
	return slices.DeleteFunc(slice, func(s string) bool { return s == item })
}
