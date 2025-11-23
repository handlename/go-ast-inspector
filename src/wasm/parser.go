package main

import (
	"encoding/json"
	"go/ast"
	"go/parser"
	"go/token"
	"syscall/js"
)

type ASTNode struct {
	Type     string                 `json:"type"`
	Pos      int                    `json:"pos"`
	End      int                    `json:"end"`
	Children []ASTNode              `json:"children"`
	Metadata map[string]interface{} `json:"metadata"`
}

func parseGoCode(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return map[string]interface{}{
			"error": "Source code argument is required",
		}
	}

	sourceCode := args[0].String()

	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, "input.go", sourceCode, parser.AllErrors|parser.ParseComments)
	if err != nil {
		return map[string]interface{}{
			"error": err.Error(),
		}
	}

	astNode := convertNode(fset, file)
	result, err := json.Marshal(astNode)
	if err != nil {
		return map[string]interface{}{
			"error": "Failed to serialize AST: " + err.Error(),
		}
	}

	return map[string]interface{}{
		"ast": string(result),
	}
}

func convertNode(fset *token.FileSet, node ast.Node) ASTNode {
	if node == nil {
		return ASTNode{}
	}

	astNode := ASTNode{
		Type:     getNodeType(node),
		Pos:      int(node.Pos()),
		End:      int(node.End()),
		Children: []ASTNode{},
		Metadata: make(map[string]interface{}),
	}

	switch n := node.(type) {
	case *ast.File:
		astNode.Metadata["name"] = n.Name.Name
		for _, decl := range n.Decls {
			astNode.Children = append(astNode.Children, convertNode(fset, decl))
		}

	case *ast.FuncDecl:
		if n.Name != nil {
			astNode.Metadata["name"] = n.Name.Name
		}
		if n.Type != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Type))
		}
		if n.Body != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Body))
		}

	case *ast.FuncType:
		if n.Params != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Params))
		}
		if n.Results != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Results))
		}

	case *ast.FieldList:
		for _, field := range n.List {
			astNode.Children = append(astNode.Children, convertNode(fset, field))
		}

	case *ast.Field:
		if n.Type != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Type))
		}
		for _, name := range n.Names {
			astNode.Metadata["names"] = append(astNode.Metadata["names"].([]string), name.Name)
		}

	case *ast.BlockStmt:
		for _, stmt := range n.List {
			astNode.Children = append(astNode.Children, convertNode(fset, stmt))
		}

	case *ast.ExprStmt:
		astNode.Children = append(astNode.Children, convertNode(fset, n.X))

	case *ast.CallExpr:
		astNode.Children = append(astNode.Children, convertNode(fset, n.Fun))
		for _, arg := range n.Args {
			astNode.Children = append(astNode.Children, convertNode(fset, arg))
		}

	case *ast.SelectorExpr:
		astNode.Children = append(astNode.Children, convertNode(fset, n.X))
		if n.Sel != nil {
			astNode.Metadata["selector"] = n.Sel.Name
		}

	case *ast.Ident:
		astNode.Metadata["name"] = n.Name

	case *ast.BasicLit:
		astNode.Metadata["value"] = n.Value
		astNode.Metadata["kind"] = n.Kind.String()

	case *ast.GenDecl:
		astNode.Metadata["tok"] = n.Tok.String()
		for _, spec := range n.Specs {
			astNode.Children = append(astNode.Children, convertNode(fset, spec))
		}

	case *ast.ImportSpec:
		if n.Path != nil {
			astNode.Metadata["path"] = n.Path.Value
		}
		if n.Name != nil {
			astNode.Metadata["name"] = n.Name.Name
		}
	}

	return astNode
}

func getNodeType(node ast.Node) string {
	switch node.(type) {
	case *ast.File:
		return "File"
	case *ast.FuncDecl:
		return "FuncDecl"
	case *ast.FuncType:
		return "FuncType"
	case *ast.FieldList:
		return "FieldList"
	case *ast.Field:
		return "Field"
	case *ast.BlockStmt:
		return "BlockStmt"
	case *ast.ExprStmt:
		return "ExprStmt"
	case *ast.CallExpr:
		return "CallExpr"
	case *ast.SelectorExpr:
		return "SelectorExpr"
	case *ast.Ident:
		return "Ident"
	case *ast.BasicLit:
		return "BasicLit"
	case *ast.GenDecl:
		return "GenDecl"
	case *ast.ImportSpec:
		return "ImportSpec"
	default:
		return "Unknown"
	}
}
