//go:build js && wasm
// +build js,wasm

package main

import (
	"encoding/json"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"syscall/js"
)

type ASTNode struct {
	Type      string         `json:"type"`
	Pos       int            `json:"pos"`
	End       int            `json:"end"`
	Children  []ASTNode      `json:"children"`
	Metadata  map[string]any `json:"metadata"`
	FieldName string         `json:"fieldName,omitempty"`
}

func parseGoCode(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return map[string]any{
			"error": "Source code argument is required",
		}
	}

	sourceCode := args[0].String()

	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, "input.go", sourceCode, parser.AllErrors|parser.ParseComments)
	if err != nil {
		return map[string]any{
			"error": err.Error(),
		}
	}

	astNode := convertNode(fset, file)
	result, err := json.Marshal(astNode)
	if err != nil {
		return map[string]any{
			"error": "Failed to serialize AST: " + err.Error(),
		}
	}

	return map[string]any{
		"ast": string(result),
	}
}

func convertNodeWithField(fset *token.FileSet, node ast.Node, fieldName string) ASTNode {
	astNode := convertNode(fset, node)
	astNode.FieldName = fieldName
	return astNode
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
		Metadata: make(map[string]any),
	}

	switch n := node.(type) {
	case *ast.File:
		astNode.Metadata["name"] = n.Name.Name
		astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Name, "Name"))
		for i, decl := range n.Decls {
			fieldName := "Decls"
			if len(n.Decls) > 1 {
				fieldName = fmt.Sprintf("Decls[%d]", i)
			}
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, decl, fieldName))
		}

	case *ast.FuncDecl:
		if n.Name != nil {
			astNode.Metadata["name"] = n.Name.Name
		}
		if n.Recv != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Recv, "Recv"))
		}
		if n.Type != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Type, "Type"))
		}
		if n.Body != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Body, "Body"))
		}

	case *ast.FuncType:
		if n.Params != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Params, "Params"))
		}
		if n.Results != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Results, "Results"))
		}

	case *ast.FieldList:
		for i, field := range n.List {
			fieldName := "List"
			if len(n.List) > 1 {
				fieldName = fmt.Sprintf("List[%d]", i)
			}
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, field, fieldName))
		}

	case *ast.Field:
		if len(n.Names) > 0 {
			names := make([]string, 0, len(n.Names))
			for _, name := range n.Names {
				names = append(names, name.Name)
			}
			astNode.Metadata["names"] = names
			for i, name := range n.Names {
				fieldName := "Names"
				if len(n.Names) > 1 {
					fieldName = fmt.Sprintf("Names[%d]", i)
				}
				astNode.Children = append(astNode.Children, convertNodeWithField(fset, name, fieldName))
			}
		}
		if n.Type != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Type, "Type"))
		}

	case *ast.BlockStmt:
		for i, stmt := range n.List {
			fieldName := "List"
			if len(n.List) > 1 {
				fieldName = fmt.Sprintf("List[%d]", i)
			}
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, stmt, fieldName))
		}

	case *ast.ExprStmt:
		astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.X, "X"))

	case *ast.CallExpr:
		astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Fun, "Fun"))
		for i, arg := range n.Args {
			fieldName := "Args"
			if len(n.Args) > 1 {
				fieldName = fmt.Sprintf("Args[%d]", i)
			}
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, arg, fieldName))
		}

	case *ast.SelectorExpr:
		astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.X, "X"))
		if n.Sel != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Sel, "Sel"))
		}

	case *ast.Ident:
		astNode.Metadata["name"] = n.Name

	case *ast.BasicLit:
		astNode.Metadata["value"] = n.Value
		astNode.Metadata["kind"] = n.Kind.String()

	case *ast.GenDecl:
		astNode.Metadata["tok"] = n.Tok.String()
		for i, spec := range n.Specs {
			fieldName := "Specs"
			if len(n.Specs) > 1 {
				fieldName = fmt.Sprintf("Specs[%d]", i)
			}
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, spec, fieldName))
		}

	case *ast.ImportSpec:
		if n.Name != nil {
			astNode.Metadata["name"] = n.Name.Name
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Name, "Name"))
		}
		if n.Path != nil {
			astNode.Metadata["path"] = n.Path.Value
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Path, "Path"))
		}

	case *ast.ValueSpec:
		if len(n.Names) > 0 {
			names := make([]string, 0, len(n.Names))
			for _, name := range n.Names {
				names = append(names, name.Name)
			}
			astNode.Metadata["names"] = names
			for i, name := range n.Names {
				fieldName := "Names"
				if len(n.Names) > 1 {
					fieldName = fmt.Sprintf("Names[%d]", i)
				}
				astNode.Children = append(astNode.Children, convertNodeWithField(fset, name, fieldName))
			}
		}
		if n.Type != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Type, "Type"))
		}
		for i, value := range n.Values {
			fieldName := "Values"
			if len(n.Values) > 1 {
				fieldName = fmt.Sprintf("Values[%d]", i)
			}
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, value, fieldName))
		}

	case *ast.TypeSpec:
		if n.Name != nil {
			astNode.Metadata["name"] = n.Name.Name
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Name, "Name"))
		}
		if n.Type != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Type, "Type"))
		}

	case *ast.StarExpr:
		if n.X != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.X, "X"))
		}

	case *ast.ArrayType:
		if n.Len != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Len, "Len"))
		}
		if n.Elt != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Elt, "Elt"))
		}

	case *ast.StructType:
		if n.Fields != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Fields, "Fields"))
		}

	case *ast.InterfaceType:
		if n.Methods != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Methods, "Methods"))
		}

	case *ast.CompositeLit:
		if n.Type != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Type, "Type"))
		}
		for i, elt := range n.Elts {
			fieldName := "Elts"
			if len(n.Elts) > 1 {
				fieldName = fmt.Sprintf("Elts[%d]", i)
			}
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, elt, fieldName))
		}

	case *ast.KeyValueExpr:
		if n.Key != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Key, "Key"))
		}
		if n.Value != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Value, "Value"))
		}

	case *ast.ParenExpr:
		if n.X != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.X, "X"))
		}

	case *ast.UnaryExpr:
		astNode.Metadata["op"] = n.Op.String()
		if n.X != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.X, "X"))
		}

	case *ast.BinaryExpr:
		astNode.Metadata["op"] = n.Op.String()
		if n.X != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.X, "X"))
		}
		if n.Y != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Y, "Y"))
		}

	case *ast.AssignStmt:
		astNode.Metadata["tok"] = n.Tok.String()
		for i, lhs := range n.Lhs {
			fieldName := "Lhs"
			if len(n.Lhs) > 1 {
				fieldName = fmt.Sprintf("Lhs[%d]", i)
			}
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, lhs, fieldName))
		}
		for i, rhs := range n.Rhs {
			fieldName := "Rhs"
			if len(n.Rhs) > 1 {
				fieldName = fmt.Sprintf("Rhs[%d]", i)
			}
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, rhs, fieldName))
		}

	case *ast.ReturnStmt:
		for i, result := range n.Results {
			fieldName := "Results"
			if len(n.Results) > 1 {
				fieldName = fmt.Sprintf("Results[%d]", i)
			}
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, result, fieldName))
		}

	case *ast.IfStmt:
		if n.Init != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Init, "Init"))
		}
		if n.Cond != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Cond, "Cond"))
		}
		if n.Body != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Body, "Body"))
		}
		if n.Else != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Else, "Else"))
		}

	case *ast.ForStmt:
		if n.Init != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Init, "Init"))
		}
		if n.Cond != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Cond, "Cond"))
		}
		if n.Post != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Post, "Post"))
		}
		if n.Body != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Body, "Body"))
		}

	case *ast.RangeStmt:
		astNode.Metadata["tok"] = n.Tok.String()
		if n.Key != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Key, "Key"))
		}
		if n.Value != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Value, "Value"))
		}
		if n.X != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.X, "X"))
		}
		if n.Body != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Body, "Body"))
		}

	case *ast.IncDecStmt:
		astNode.Metadata["tok"] = n.Tok.String()
		if n.X != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.X, "X"))
		}

	case *ast.IndexExpr:
		if n.X != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.X, "X"))
		}
		if n.Index != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Index, "Index"))
		}

	case *ast.TypeAssertExpr:
		if n.X != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.X, "X"))
		}
		if n.Type != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Type, "Type"))
		}

	case *ast.DeclStmt:
		if n.Decl != nil {
			astNode.Children = append(astNode.Children, convertNodeWithField(fset, n.Decl, "Decl"))
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
