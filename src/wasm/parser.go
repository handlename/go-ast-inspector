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
		if len(n.Names) > 0 {
			names := make([]string, 0, len(n.Names))
			for _, name := range n.Names {
				names = append(names, name.Name)
			}
			astNode.Metadata["names"] = names
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

	case *ast.ValueSpec:
		if len(n.Names) > 0 {
			names := make([]string, 0, len(n.Names))
			for _, name := range n.Names {
				names = append(names, name.Name)
			}
			astNode.Metadata["names"] = names
		}
		if n.Type != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Type))
		}
		for _, value := range n.Values {
			astNode.Children = append(astNode.Children, convertNode(fset, value))
		}

	case *ast.TypeSpec:
		if n.Name != nil {
			astNode.Metadata["name"] = n.Name.Name
		}
		if n.Type != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Type))
		}

	case *ast.StarExpr:
		if n.X != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.X))
		}

	case *ast.ArrayType:
		if n.Len != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Len))
		}
		if n.Elt != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Elt))
		}

	case *ast.StructType:
		if n.Fields != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Fields))
		}

	case *ast.InterfaceType:
		if n.Methods != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Methods))
		}

	case *ast.CompositeLit:
		if n.Type != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Type))
		}
		for _, elt := range n.Elts {
			astNode.Children = append(astNode.Children, convertNode(fset, elt))
		}

	case *ast.KeyValueExpr:
		if n.Key != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Key))
		}
		if n.Value != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Value))
		}

	case *ast.ParenExpr:
		if n.X != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.X))
		}

	case *ast.UnaryExpr:
		astNode.Metadata["op"] = n.Op.String()
		if n.X != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.X))
		}

	case *ast.BinaryExpr:
		astNode.Metadata["op"] = n.Op.String()
		if n.X != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.X))
		}
		if n.Y != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Y))
		}

	case *ast.AssignStmt:
		astNode.Metadata["tok"] = n.Tok.String()
		for _, lhs := range n.Lhs {
			astNode.Children = append(astNode.Children, convertNode(fset, lhs))
		}
		for _, rhs := range n.Rhs {
			astNode.Children = append(astNode.Children, convertNode(fset, rhs))
		}

	case *ast.ReturnStmt:
		for _, result := range n.Results {
			astNode.Children = append(astNode.Children, convertNode(fset, result))
		}

	case *ast.IfStmt:
		if n.Init != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Init))
		}
		if n.Cond != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Cond))
		}
		if n.Body != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Body))
		}
		if n.Else != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Else))
		}

	case *ast.ForStmt:
		if n.Init != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Init))
		}
		if n.Cond != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Cond))
		}
		if n.Post != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Post))
		}
		if n.Body != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Body))
		}

	case *ast.RangeStmt:
		astNode.Metadata["tok"] = n.Tok.String()
		if n.Key != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Key))
		}
		if n.Value != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Value))
		}
		if n.X != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.X))
		}
		if n.Body != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Body))
		}

	case *ast.IncDecStmt:
		astNode.Metadata["tok"] = n.Tok.String()
		if n.X != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.X))
		}

	case *ast.IndexExpr:
		if n.X != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.X))
		}
		if n.Index != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Index))
		}

	case *ast.TypeAssertExpr:
		if n.X != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.X))
		}
		if n.Type != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Type))
		}

	case *ast.DeclStmt:
		if n.Decl != nil {
			astNode.Children = append(astNode.Children, convertNode(fset, n.Decl))
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
	case *ast.ValueSpec:
		return "ValueSpec"
	case *ast.TypeSpec:
		return "TypeSpec"
	case *ast.StarExpr:
		return "StarExpr"
	case *ast.ArrayType:
		return "ArrayType"
	case *ast.StructType:
		return "StructType"
	case *ast.InterfaceType:
		return "InterfaceType"
	case *ast.CompositeLit:
		return "CompositeLit"
	case *ast.KeyValueExpr:
		return "KeyValueExpr"
	case *ast.ParenExpr:
		return "ParenExpr"
	case *ast.UnaryExpr:
		return "UnaryExpr"
	case *ast.BinaryExpr:
		return "BinaryExpr"
	case *ast.AssignStmt:
		return "AssignStmt"
	case *ast.ReturnStmt:
		return "ReturnStmt"
	case *ast.IfStmt:
		return "IfStmt"
	case *ast.ForStmt:
		return "ForStmt"
	case *ast.RangeStmt:
		return "RangeStmt"
	case *ast.IncDecStmt:
		return "IncDecStmt"
	case *ast.IndexExpr:
		return "IndexExpr"
	case *ast.TypeAssertExpr:
		return "TypeAssertExpr"
	case *ast.DeclStmt:
		return "DeclStmt"
	default:
		return "Unknown"
	}
}
