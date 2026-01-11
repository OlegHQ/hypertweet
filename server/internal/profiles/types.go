package profiles

type Profile struct {
	ID                  string   `bson:"_id" json:"id"`
	ModelName           string   `bson:"modelName" json:"modelName"`
	ChatModel           *string  `bson:"chatModel,omitempty" json:"chatModel,omitempty"`
	UserBio             *string  `bson:"userBio,omitempty" json:"userBio,omitempty"`
	CustomReplyGuidance *string  `bson:"customReplyGuidance,omitempty" json:"customReplyGuidance,omitempty"`
	PostProcessReply    *bool    `bson:"postProcessReply,omitempty" json:"postProcessReply,omitempty"`
	ReplyPromptOptions  []string `bson:"replyPromptOptions" json:"replyPromptOptions"`
	ChatBotPersona      *string  `bson:"chatBotPersona,omitempty" json:"chatBotPersona,omitempty"`
}

type UpdateProfileRequest struct {
	UserBio             *string  `json:"userBio,omitempty"`
	CustomReplyGuidance *string  `json:"customReplyGuidance,omitempty"`
	PostProcessReply    *bool    `json:"postProcessReply,omitempty"`
	ReplyPromptOptions  []string `json:"replyPromptOptions,omitempty"`
	ModelName           *string  `json:"modelName,omitempty"`
	ChatModel           *string  `json:"chatModel,omitempty"`
	ChatBotPersona      *string  `json:"chatBotPersona,omitempty"`
}

type UpdatePasswordRequest struct {
	NewPassword string `json:"newPassword"`
}

type ModelDef struct {
	ModelName string `json:"modelName"`
}

type ModelsResponse struct {
	DefaultModel string     `json:"defaultModel"`
	AllModels    []ModelDef `json:"allModels"`
}

var AllModels = []string{
	"llama-3.3-70b-versatile",
	"llama-3.1-8b-instant",
	"mixtral-8x7b-32768",
	"gemma2-9b-it",
}

const DefaultModel = "llama-3.3-70b-versatile"

var ValidReplyPromptOptions = map[string]bool{
	"NoEmojis":      true,
	"NoHashtags":    true,
	"NoPunctuation": true,
}

func IsValidModel(model string) bool {
	for _, m := range AllModels {
		if m == model {
			return true
		}
	}
	return false
}

func IsValidReplyPromptOption(opt string) bool {
	return ValidReplyPromptOptions[opt]
}
