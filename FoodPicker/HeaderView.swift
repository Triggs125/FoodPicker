//
//  HeaderView.swift
//  FoodPicker
//
//  Created by Tanner Driggers on 1/23/22.
//

import SwiftUI
import UIKit

struct HeaderView: View {
    var title: String
    @ObservedObject var pageViewModel = PageViewModel()
    var body: some View {
        HStack {
            Text(title)
                .font(.system(size: 30, weight:.regular))
            
            Spacer()
            
//            NavigationLink(destination: AccountOverView()) {
//                Image(systemName: "person.crop.circle")
//                    .font(.system(size: 30, weight: .regular))
//            }
            
            Button(action: {
                print("Account View")
                pageViewModel.changeToAccountPage()
            }) {
                Image(systemName: "person.crop.circle")
                    .font(.system(size: 30, weight: .regular))
            }
            .accentColor(Color.red)
        }
        .padding()
    }
}

struct HeaderView_Previews: PreviewProvider {
    static var previews: some View {
        HeaderView(title: "Good evening")
            .previewLayout(.fixed(width: 375, height: 70))
    }
}
