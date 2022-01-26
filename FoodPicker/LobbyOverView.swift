//
//  LobbyOverView.swift
//  FoodPicker
//
//  Created by Tanner Driggers on 1/25/22.
//

import SwiftUI

struct Hero: Identifiable {
    let id: UUID = UUID()
    let name: String
}

struct LobbyOverView: View {
    var texts = [
        Hero(name: "Hello World 1"),
        Hero(name: "Hello World 2"),
        Hero(name: "Hello World 3")
    ]
    
    var body: some View {
        VStack {
            Text("LobbyOverView!")
                .padding()
                .font(.system(size: 30, weight: .regular))
            
            List(texts) { text in
                Text(text.name)
                    .padding()
            }
        }
    }
}

struct LobbyOverView_Previews: PreviewProvider {
    static var previews: some View {
        LobbyOverView()
    }
}
