package apitokens

import "testing"

func TestParseRawToken(t *testing.T) {
	id, secret, err := ParseRawToken("htmcp_123_abc")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if id != "123" {
		t.Fatalf("expected id 123, got %q", id)
	}
	if secret != "abc" {
		t.Fatalf("expected secret abc, got %q", secret)
	}

	_, _, err = ParseRawToken("badprefix_123_abc")
	if err == nil {
		t.Fatalf("expected error for bad prefix")
	}

	_, _, err = ParseRawToken("htmcp_onlytwo")
	if err == nil {
		t.Fatalf("expected error for bad format")
	}
}

func TestHashSecretDeterministic(t *testing.T) {
	h1 := HashSecret("abc")
	h2 := HashSecret("abc")
	if h1 != h2 {
		t.Fatalf("expected deterministic hash")
	}

	h3 := HashSecret("abcd")
	if h1 == h3 {
		t.Fatalf("expected different hash")
	}
}
