package profiles

type Profile struct {
	ID                  string   `bson:"_id" json:"id"`
	ModelName           string   `bson:"ModelName" json:"modelName"`
	ChatModel           *string  `bson:"ChatModel,omitempty" json:"chatModel,omitempty"`
	UserBio             *string  `bson:"UserBio,omitempty" json:"userBio,omitempty"`
	CustomReplyGuidance *string  `bson:"CustomReplyGuidance,omitempty" json:"customReplyGuidance,omitempty"`
	PostProcessReply    *bool    `bson:"PostProcessReply,omitempty" json:"postProcessReply,omitempty"`
	ReplyPromptOptions  []string `bson:"ReplyPromptOptions" json:"replyPromptOptions"`
	ChatBotPersona      *string  `bson:"ChatBotPersona,omitempty" json:"chatBotPersona,omitempty"`
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
	"openai/gpt-oss-120b",
	"openai/gpt-oss-20b",
	"llama-3.3-70b-versatile",
	"llama-3.1-8b-instant",
}

const DefaultModel = "openai/gpt-oss-120b"

func NewDefaultProfile(userID string) *Profile {
	postProcess := true
	return &Profile{
		ID:                 userID,
		ModelName:          DefaultModel,
		PostProcessReply:   &postProcess,
		ReplyPromptOptions: []string{"NoEmojis", "NoHashtags"},
	}
}

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
