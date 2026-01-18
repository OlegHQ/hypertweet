package ai

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"time"

	"github.com/hypertweet/server/internal/auth"
	"github.com/hypertweet/server/internal/profiles"
	"github.com/hypertweet/server/internal/tones"
	"github.com/hypertweet/server/internal/tracing"
)

type Service struct {
	groq        *GroqClient
	userRepo    *auth.UserRepo
	profileRepo *profiles.ProfileRepo
	toneRepo    *tones.ToneRepo
	traceRepo   *tracing.TraceRepo
	log         *slog.Logger
}

func NewService(groq *GroqClient, userRepo *auth.UserRepo, profileRepo *profiles.ProfileRepo, toneRepo *tones.ToneRepo, traceRepo *tracing.TraceRepo, log *slog.Logger) *Service {
	return &Service{
		groq:        groq,
		userRepo:    userRepo,
		profileRepo: profileRepo,
		toneRepo:    toneRepo,
		traceRepo:   traceRepo,
		log:         log,
	}
}

func (s *Service) GenerateReply(ctx context.Context, userID, toneID string, page Page) (*ReplyResponse, error) {
	_, profile, err := s.resolveUserProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	tone, err := s.resolveTone(ctx, toneID)
	if err != nil {
		return nil, err
	}

	ps := extractProfileSettings(profile)
	prompt := BuildReplyPrompt(tone, page, ps.userBio, ps.customGuidance, ps.options)
	messages := []Message{{Role: "user", Content: prompt}}

	start := time.Now()
	completion, err := s.groq.Complete(ctx, ps.model, messages)
	if err != nil {
		return nil, err
	}
	duration := time.Since(start)

	if ps.postProcess {
		completion = applyPostProcess(completion)
	}

	event := &tracing.TraceEvent{
		Type:       "reply",
		UserID:     userID,
		Model:      ps.model,
		Prompt:     prompt,
		Response:   completion,
		TimeTookMs: int(duration.Milliseconds()),
	}
	eventID, err := s.traceRepo.Save(ctx, event)
	if err != nil {
		return nil, err
	}

	return &ReplyResponse{
		EventID: eventID,
		Reply:   completion,
	}, nil
}

func (s *Service) RefineReply(ctx context.Context, userID, platform, originalPost, draftReply, instruction string) (*ReplyResponse, error) {
	_, profile, err := s.resolveUserProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	ps := extractProfileSettings(profile)
	prompt := BuildRefinePrompt(platform, originalPost, draftReply, instruction, ps.userBio, ps.customGuidance, ps.options)
	messages := []Message{{Role: "user", Content: prompt}}

	start := time.Now()
	completion, err := s.groq.Complete(ctx, ps.model, messages)
	if err != nil {
		return nil, err
	}
	duration := time.Since(start)

	if ps.postProcess {
		completion = applyPostProcess(completion)
	}

	event := &tracing.TraceEvent{
		Type:       "refine",
		UserID:     userID,
		Model:      ps.model,
		Prompt:     prompt,
		Response:   completion,
		TimeTookMs: int(duration.Milliseconds()),
	}
	eventID, err := s.traceRepo.Save(ctx, event)
	if err != nil {
		return nil, err
	}

	return &ReplyResponse{
		EventID: eventID,
		Reply:   completion,
	}, nil
}

func (s *Service) StreamChat(ctx context.Context, userID string, chatReq ChatRequest, onToken func(string) error) (string, error) {
	_, profile, err := s.resolveUserProfile(ctx, userID)
	if err != nil {
		return "", err
	}

	ps := extractProfileSettings(profile)
	systemPrompt := BuildChatPrompt(ps.persona, chatReq.PageContext, ps.userBio, ps.options)

	messages := []Message{{Role: "system", Content: systemPrompt}}
	for _, m := range chatReq.Messages {
		role := m.Role
		if role != "user" && role != "assistant" {
			continue
		}
		messages = append(messages, Message{Role: role, Content: m.Content})
	}

	var responseBuilder strings.Builder
	start := time.Now()

	err = s.groq.Stream(ctx, ps.chatModel, messages, func(token string) error {
		processed := applyPostProcess(token)
		responseBuilder.WriteString(processed)
		return onToken(processed)
	})
	if err != nil {
		return "", err
	}

	duration := time.Since(start)

	event := &tracing.TraceEvent{
		Type:       "chat",
		UserID:     userID,
		Model:      ps.chatModel,
		Prompt:     systemPrompt,
		Response:   responseBuilder.String(),
		TimeTookMs: int(duration.Milliseconds()),
	}
	eventID, err := s.traceRepo.Save(ctx, event)
	if err != nil {
		s.log.Error("failed to save chat trace", "error", err, "userID", userID)
	}

	return eventID, nil
}

func (s *Service) resolveUserProfile(ctx context.Context, userID string) (*auth.User, *profiles.Profile, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, nil, err
	}

	profile, err := s.profileRepo.FindByID(ctx, userID)
	if err != nil && !errors.Is(err, profiles.ErrProfileNotFound) {
		return nil, nil, err
	}

	return user, profile, nil
}

type profileSettings struct {
	model          string
	userBio        *string
	customGuidance *string
	options        []string
	postProcess    bool
	chatModel      string
	persona        *string
}

func extractProfileSettings(profile *profiles.Profile) profileSettings {
	s := profileSettings{
		model:       profiles.DefaultModel,
		postProcess: true,
	}
	if profile == nil {
		return s
	}

	s.model = profile.ModelName
	s.userBio = profile.UserBio
	s.customGuidance = profile.CustomReplyGuidance
	s.options = profile.ReplyPromptOptions
	s.persona = profile.ChatBotPersona

	if profile.PostProcessReply != nil {
		s.postProcess = *profile.PostProcessReply
	}

	if profile.ChatModel != nil {
		s.chatModel = *profile.ChatModel
	} else {
		s.chatModel = s.model
	}

	return s
}

func (s *Service) resolveTone(ctx context.Context, toneID string) (*tones.Tone, error) {
	if tones.IsDefaultTone(toneID) {
		tone := tones.GetDefaultTone(toneID)
		if tone == nil {
			return nil, tones.ErrToneNotFound
		}
		return tone, nil
	}

	return s.toneRepo.FindByID(ctx, toneID)
}

var unicodeReplacer = strings.NewReplacer(
	"\u2014", ", ", // em dash
	"\u2019", "'", // right single quote
	"\u201c", "\"", // left double quote
	"\u00a0", " ", // non-breaking space
	"\u2018", "'", // left single quote
	"\u201d", "\"", // right double quote
	"\u2026", "...", // ellipsis
)

func applyPostProcess(text string) string {
	return unicodeReplacer.Replace(text)
}
