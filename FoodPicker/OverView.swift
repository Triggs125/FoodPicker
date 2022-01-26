//
//  ContentView.swift
//  FoodPicker
//
//  Created by Tanner Driggers on 1/23/22.
//

import SwiftUI

struct OverView: View {
    @ObservedObject var pageViewModel = PageViewModel()
    
    var body: some View {
        WebView(url: URL(string: "https://google.com")!)
//        VStack {
//            HeaderView(title: pageViewModel.pageTitle)
//
//            if (pageViewModel.page == pageViewModel.lobby) {
//                LobbyOverView()
//            } else if (pageViewModel.page == pageViewModel.account) {
//                AccountOverView()
//            } else {
//                LobbyOverView()
//            }
//        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        OverView()
    }
}
