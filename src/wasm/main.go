package main

import (
	"syscall/js"
)

func main() {
	c := make(chan struct{})

	js.Global().Set("parseGoCode", js.FuncOf(parseGoCode))

	<-c
}
