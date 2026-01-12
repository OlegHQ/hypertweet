package ai

import (
	"fmt"
	"strings"

	"github.com/hypertweet/server/internal/tones"
)

type Site int

const (
	SiteX Site = iota
	SiteReddit
	SiteLinkedIn
	SiteGeneric
)

func ParseSite(site string) Site {
	site = strings.ToLower(site)
	switch {
	case strings.Contains(site, "twitter") || strings.Contains(site, "x.com"):
		return SiteX
	case strings.Contains(site, "reddit"):
		return SiteReddit
	case strings.Contains(site, "linkedin"):
		return SiteLinkedIn
	default:
		return SiteGeneric
	}
}

func GetPlatformGuidelines(site Site) []string {
	switch site {
	case SiteX:
		return []string{
			"Keep response under 280 characters unless thread format is appropriate",
			"Use casual, conversational tone typical of Twitter/X",
			"Hashtags are optional and should be used sparingly",
			"Emojis can enhance engagement but don't overuse",
		}
	case SiteReddit:
		return []string{
			"Match the subreddit's culture and tone",
			"Be informative and add value to the discussion",
			"Use markdown formatting (bold, lists, quotes) when helpful",
			"Avoid excessive self-promotion",
		}
	case SiteLinkedIn:
		return []string{
			"Maintain professional tone",
			"Add insights or professional perspective",
			"Be constructive and supportive",
			"Keep appropriate business context",
		}
	default:
		return []string{
			"Be helpful and relevant to the discussion",
			"Match the platform's general tone",
			"Keep response appropriately sized for the context",
		}
	}
}

func formatUser(user PageUser) string {
	var parts []string
	if user.UserName != nil {
		parts = append(parts, "@"+*user.UserName)
	}
	if user.Name != nil {
		parts = append(parts, *user.Name)
	}
	if user.Bio != nil {
		parts = append(parts, "Bio: "+*user.Bio)
	}
	if user.Followers != nil {
		parts = append(parts, fmt.Sprintf("%d followers", *user.Followers))
	}
	if len(parts) == 0 {
		return "Unknown user"
	}
	return strings.Join(parts, " | ")
}

func formatPost(post Post) string {
	author := formatUser(post.Author)
	time := ""
	if post.Time != nil {
		time = fmt.Sprintf(" (%s)", *post.Time)
	}
	return fmt.Sprintf("**%s**%s:\n%s", author, time, post.Text)
}

func formatThreadQuote(post Post, depth, maxDepth, maxReplies int) []string {
	if depth >= maxDepth {
		return nil
	}

	prefix := strings.Repeat("> ", depth)
	author := "Unknown"
	if post.Author.UserName != nil {
		author = "@" + *post.Author.UserName
	} else if post.Author.Name != nil {
		author = *post.Author.Name
	}

	time := ""
	if post.Time != nil {
		time = fmt.Sprintf(" (%s)", *post.Time)
	}

	header := fmt.Sprintf("%s**%s**%s:", prefix, author, time)
	textLines := strings.Split(post.Text, "\n")
	for i, line := range textLines {
		textLines[i] = prefix + line
	}

	result := []string{header + "\n" + strings.Join(textLines, "\n")}

	replies := post.Replies
	if len(replies) > maxReplies {
		hidden := len(replies) - maxReplies
		replies = replies[:maxReplies]
		result = append(result, fmt.Sprintf("%s[+%d more]", strings.Repeat("> ", depth+1), hidden))
	}

	for _, reply := range replies {
		result = append(result, formatThreadQuote(reply, depth+1, maxDepth, maxReplies)...)
	}

	return result
}

func extractPageContext(page Page) (activePost string, threadContext *string, currentDraft *string, guidelines []string) {
	var activePostObj *Post

	switch {
	case len(page.Posts) == 1:
		activePostObj = &page.Posts[0]
	case page.ActivePost != nil:
		activePostObj = page.ActivePost
	case len(page.Posts) > 0:
		activePostObj = &page.Posts[0]
	}

	if activePostObj != nil {
		activePost = formatPost(*activePostObj)

		if len(activePostObj.Replies) > 0 {
			lines := []string{}
			for _, reply := range activePostObj.Replies {
				lines = append(lines, formatThreadQuote(reply, 0, 3, 5)...)
			}
			if len(lines) > 0 {
				formatted := strings.Join(lines, "\n\n")
				threadContext = &formatted
			}
		}

		if activePostObj.CurrentReplyDraft != nil && strings.TrimSpace(*activePostObj.CurrentReplyDraft) != "" {
			currentDraft = activePostObj.CurrentReplyDraft
		}
	} else {
		activePost = "No post content"
	}

	guidelines = GetPlatformGuidelines(ParseSite(page.Site))
	return
}

func formatReplyPromptOption(opt string) string {
	switch opt {
	case "NoEmojis":
		return "No emojis"
	case "NoHashtags":
		return "No hash tags allowed"
	case "NoPunctuation":
		return "loose punctuation"
	default:
		return opt
	}
}

func BuildReplyPrompt(tone *tones.Tone, page Page, userBio, customGuidance *string, options []string) string {
	activePost, threadContext, currentDraft, guidelines := extractPageContext(page)

	var b strings.Builder

	taskInstr := "Generate a reply to the social media post below. Write ONLY the reply text, nothing else."
	if currentDraft != nil {
		taskInstr = "Edit and refine the existing reply draft below to match the specified tone. Write ONLY the revised reply text, nothing else."
	}

	b.WriteString(fmt.Sprintf("<task>\n%s\n</task>\n\n", taskInstr))

	b.WriteString(fmt.Sprintf("<platform>\nSite: %s\nURL: %s\n\nPlatform Guidelines:\n", page.Site, page.Url))
	for _, g := range guidelines {
		b.WriteString(fmt.Sprintf("- %s\n", g))
	}
	b.WriteString("</platform>\n\n")

	if userBio != nil {
		b.WriteString(fmt.Sprintf("<user_bio>\n%s\n</user_bio>\n\n", *userBio))
	}

	b.WriteString(fmt.Sprintf("<tone_instruction>\nStyle: %s\n%s\n</tone_instruction>\n\n", tone.Title, tone.Instruction))

	b.WriteString(fmt.Sprintf("<post_to_reply>\n%s\n</post_to_reply>\n\n", activePost))

	if threadContext != nil {
		b.WriteString(fmt.Sprintf("<thread_context>\n%s\n</thread_context>\n\n", *threadContext))
	}

	b.WriteString("<output_requirements>\n")
	reqs := []string{
		"Write ONLY the reply text",
		"Do not include any meta-commentary, explanations, or formatting outside the reply",
		"Do not prefix with \"Reply:\" or similar labels",
		"Match the specified tone exactly",
		"Be authentic and engaging",
	}
	for _, opt := range options {
		reqs = append(reqs, formatReplyPromptOption(opt))
	}
	for _, r := range reqs {
		b.WriteString(fmt.Sprintf("- %s\n", r))
	}
	b.WriteString("</output_requirements>\n\n")

	if customGuidance != nil {
		b.WriteString(fmt.Sprintf("<user_defined_guidance>\n%s\n</user_defined_guidance>\n\n", *customGuidance))
	}

	if currentDraft != nil {
		b.WriteString(fmt.Sprintf("<current_draft_to_edit>\n%s\n</current_draft_to_edit>\n\n", *currentDraft))
	}

	return b.String()
}

func BuildChatPrompt(persona *string, page Page, userBio *string, options []string) string {
	activePost, threadContext, currentDraft, _ := extractPageContext(page)

	defaultPersona := "You are an AI assistant helping users craft social media replies. Help critique and improve draft replies. Be concise and actionable."
	p := defaultPersona
	if persona != nil && *persona != "" {
		p = *persona
	}

	var b strings.Builder

	b.WriteString(p + "\n\n")

	b.WriteString(fmt.Sprintf("<platform>\nSite: %s\nURL: %s\n</platform>\n\n", page.Site, page.Url))

	if userBio != nil {
		b.WriteString(fmt.Sprintf("<user_bio>\n%s\n</user_bio>\n\n", *userBio))
	}

	b.WriteString(fmt.Sprintf("<post_to_reply>\n%s\n</post_to_reply>\n\n", activePost))

	if threadContext != nil {
		b.WriteString(fmt.Sprintf("<thread_context>\n%s\n</thread_context>\n\n", *threadContext))
	}

	if currentDraft != nil {
		b.WriteString(fmt.Sprintf("<current_draft>\n%s\n</current_draft>\n\n", *currentDraft))
	}

	if len(options) > 0 {
		b.WriteString("<guidelines>\n")
		for _, opt := range options {
			switch opt {
			case "NoEmojis":
				b.WriteString("- User prefers no emojis\n")
			case "NoHashtags":
				b.WriteString("- User prefers no hashtags\n")
			case "NoPunctuation":
				b.WriteString("- User prefers loose punctuation\n")
			}
		}
		b.WriteString("</guidelines>\n\n")
	}

	b.WriteString("<output_format>\n")
	b.WriteString("- When providing a ready-to-use reply, wrap it in a ```reply code block\n")
	b.WriteString("- Only use ```reply for final, ready-to-paste text - not for examples or drafts being discussed\n")
	b.WriteString("</output_format>\n")

	return b.String()
}

func BuildRefinePrompt(platform, originalPost, draftReply, instruction string, userBio, customGuidance *string, options []string) string {
	site := ParseSite(platform)
	guidelines := GetPlatformGuidelines(site)

	var b strings.Builder

	b.WriteString("<task>\nRefine the reply draft according to the user's instruction. The instruction must be followed exactly. Write ONLY the refined reply text, nothing else.\n</task>\n\n")

	b.WriteString("<platform_guidelines>\n")
	for _, g := range guidelines {
		b.WriteString(fmt.Sprintf("- %s\n", g))
	}
	b.WriteString("</platform_guidelines>\n\n")

	if userBio != nil {
		b.WriteString(fmt.Sprintf("<user_bio>\n%s\n</user_bio>\n\n", *userBio))
	}

	b.WriteString(fmt.Sprintf("<original_post>\n%s\n</original_post>\n\n", originalPost))

	b.WriteString(fmt.Sprintf("<current_draft>\n%s\n</current_draft>\n\n", draftReply))

	b.WriteString(fmt.Sprintf("<refine_instruction>\n%s\n</refine_instruction>\n\n", instruction))

	b.WriteString("<output_requirements>\n")
	reqs := []string{
		"Write ONLY the refined reply text",
		"Follow the refine instruction exactly",
		"Do not include any meta-commentary or explanations",
		"Do not prefix with labels like 'Refined:' or 'Reply:'",
		"Preserve the original meaning unless instructed otherwise",
	}
	for _, opt := range options {
		reqs = append(reqs, formatReplyPromptOption(opt))
	}
	for _, r := range reqs {
		b.WriteString(fmt.Sprintf("- %s\n", r))
	}
	b.WriteString("</output_requirements>\n\n")

	if customGuidance != nil {
		b.WriteString(fmt.Sprintf("<user_defined_guidance>\n%s\n</user_defined_guidance>\n", *customGuidance))
	}

	return b.String()
}
