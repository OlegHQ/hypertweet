package inbox

import "errors"

var (
	ErrItemNotFound = errors.New("item not found")
	ErrItemConflict = errors.New("item already exists")
)
