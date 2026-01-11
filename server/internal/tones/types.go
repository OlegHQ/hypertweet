package tones

import "time"

type Tone struct {
	ID          string    `bson:"_id" json:"id"`
	UserID      *string   `bson:"UserId,omitempty" json:"userId,omitempty"`
	Title       string    `bson:"Title" json:"title"`
	Instruction string    `bson:"Instruction" json:"instruction"`
	Enabled     *bool     `bson:"Enabled,omitempty" json:"enabled,omitempty"`
	CreatedAt   time.Time `bson:"CreatedAt" json:"createdAt"`
}

type ToneResponse struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Instruction string `json:"instruction"`
	IsDefault   bool   `json:"isDefault"`
	Enabled     *bool  `json:"enabled,omitempty"`
}

type CreateToneRequest struct {
	Title       string `json:"title"`
	Instruction string `json:"instruction"`
}

type UpdateToneRequest struct {
	Title       string `json:"title"`
	Instruction string `json:"instruction"`
}

var defaultCreatedAt = time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)

var DefaultTones = []Tone{
	{
		ID:          "default-professional",
		Title:       "Professional",
		Instruction: "Write in a professional, business-appropriate tone. Be clear, concise, and respectful.",
		CreatedAt:   defaultCreatedAt,
	},
	{
		ID:          "default-friendly",
		Title:       "Friendly",
		Instruction: "Write in a warm, approachable, and conversational tone. Be personable and engaging.",
		CreatedAt:   defaultCreatedAt,
	},
	{
		ID:          "default-witty",
		Title:       "Witty",
		Instruction: "Write with clever humor and sharp observations. Be playful but not offensive.",
		CreatedAt:   defaultCreatedAt,
	},
	{
		ID:          "default-insightful",
		Title:       "Insightful",
		Instruction: "Provide thoughtful, analytical perspectives. Add value through unique observations and deeper understanding.",
		CreatedAt:   defaultCreatedAt,
	},
	{
		ID:          "default-casual",
		Title:       "Casual",
		Instruction: "Write in a relaxed, informal style. Use everyday language and be relatable.",
		CreatedAt:   defaultCreatedAt,
	},
}

func IsDefaultTone(id string) bool {
	for _, t := range DefaultTones {
		if t.ID == id {
			return true
		}
	}
	return false
}

func GetDefaultTone(id string) *Tone {
	for _, t := range DefaultTones {
		if t.ID == id {
			return &t
		}
	}
	return nil
}

func ToResponse(tone *Tone) ToneResponse {
	return ToneResponse{
		ID:          tone.ID,
		Title:       tone.Title,
		Instruction: tone.Instruction,
		IsDefault:   tone.UserID == nil,
		Enabled:     tone.Enabled,
	}
}
